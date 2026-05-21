const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, getContentType } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let currentQrBase64 = null;
let pairingCode = null;
let isConnected = false;
let isLinking = false;
let linkMethod = 'qr';
let linkPhone = '';
let qrError = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 6;
let cronJob = null;

if (!fs.existsSync('auth_info_baileys')) {
    fs.mkdirSync('auth_info_baileys');
}

const CONFIG_FILE = path.join(__dirname, 'bot_config.json');

function normalizePhone(input) {
    if (!input) return '';
    return String(input).split('@')[0].split(':')[0].replace(/\D/g, '');
}

/** Numéro admin obligatoire — toujours autorisé, non supprimable */
const MANDATORY_ADMIN_PHONE = normalizePhone(
    process.env.MANDATORY_ADMIN_PHONE || '33762641473'
);

/** Cache LID → numéro (WhatsApp 7 utilise parfois @lid au lieu du numéro) */
const lidPhoneCache = new Map();

let botConfig = { cronTime: "20:00", authorizedPhones: [] };

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2));
}

function isValidPhoneDigits(digits) {
    return digits.length >= 9 && digits.length <= 13;
}

function migrateConfig(parsed) {
    const cronTime = parsed.cronTime || "20:00";
    let authorizedPhones = Array.isArray(parsed.authorizedPhones)
        ? parsed.authorizedPhones.map(normalizePhone).filter(Boolean)
        : [];

    if (parsed.authorizedPhone) {
        const legacy = normalizePhone(parsed.authorizedPhone);
        if (legacy && !authorizedPhones.includes(legacy)) {
            authorizedPhones.push(legacy);
        }
    }

    authorizedPhones = authorizedPhones
        .filter(p => p !== MANDATORY_ADMIN_PHONE)
        .filter(p => isValidPhoneDigits(p));
    return { cronTime, authorizedPhones };
}

function getAllAuthorizedPhones() {
    const extra = (botConfig.authorizedPhones || [])
        .map(normalizePhone)
        .filter(p => p && p !== MANDATORY_ADMIN_PHONE);
    return [...new Set([MANDATORY_ADMIN_PHONE, ...extra])];
}

function getStatusPhonesPayload() {
    return {
        mandatoryPhone: MANDATORY_ADMIN_PHONE,
        additionalPhones: botConfig.authorizedPhones || [],
        authorizedPhones: getAllAuthorizedPhones(),
        authorizedPhone: getAllAuthorizedPhones().join(', '),
        cronTimezone: CRON_TIMEZONE,
    };
}

if (fs.existsSync(CONFIG_FILE)) {
    try {
        const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        botConfig = migrateConfig(parsed);
        saveConfig();
    } catch (e) { console.error("Erreur de lecture de la config", e); }
}

function isPnJid(jid) {
    const s = String(jid || '');
    return s.includes('@s.whatsapp.net') || s.endsWith('@c.us');
}

function isLidJid(jid) {
    return String(jid || '').includes('@lid');
}

function storeLidMapping(lid, pn) {
    const lidKey = normalizePhone(lid);
    const phone = normalizePhone(pn);
    if (lidKey && phone && isValidPhoneDigits(phone)) {
        lidPhoneCache.set(lidKey, phone);
    }
}

function cacheLidFromMessage(key) {
    if (!key) return;
    const primary = key.participant || key.remoteJid;
    const alt = key.participantAlt || key.remoteJidAlt;
    if (primary && alt && (isLidJid(primary) || !isPnJid(primary)) && isPnJid(alt)) {
        storeLidMapping(primary, alt);
    }
}

function resolveSenderPhone(msg) {
    const key = msg.key || {};

    if (msg.key.fromMe) {
        return sock?.user?.id ? normalizePhone(sock.user.id) : '';
    }

    // Baileys 7 : JID alternatif = vrai numéro quand le principal est un LID
    for (const altJid of [key.participantAlt, key.remoteJidAlt]) {
        if (altJid && isPnJid(altJid)) {
            const phone = normalizePhone(altJid);
            if (isValidPhoneDigits(phone)) return phone;
        }
    }

    const primary = key.participant || key.remoteJid || '';

    if (primary && isPnJid(primary)) {
        const phone = normalizePhone(primary);
        if (isValidPhoneDigits(phone)) return phone;
    }

    const lidKey = normalizePhone(primary);

    if (lidKey && lidPhoneCache.has(lidKey)) {
        return lidPhoneCache.get(lidKey);
    }

    if (sock?.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const lidJid = isLidJid(primary)
                ? primary
                : `${lidKey}@lid`;
            const pn = sock.signalRepository.lidMapping.getPNForLID(lidJid);
            if (pn) {
                const phone = normalizePhone(pn);
                if (isValidPhoneDigits(phone)) {
                    storeLidMapping(lidKey, phone);
                    return phone;
                }
            }
        } catch (e) {
            console.warn('[BOT] getPNForLID:', e.message);
        }
    }

    // Ne pas traiter un LID brut comme un numéro (ex: 210479888756896)
    if (isValidPhoneDigits(lidKey) && !isLidJid(primary)) {
        return lidKey;
    }

    return '';
}

function isSenderAuthorized(msg) {
    const senderPhone = resolveSenderPhone(msg);
    if (!senderPhone) return false;
    return getAllAuthorizedPhones().includes(senderPhone);
}

function verifyApiSecret(req, res) {
    const secret = req.headers['x-api-secret'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
    if (secret !== SITE_API_SECRET) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    return true;
}

const SITE_API_SECRET = process.env.SITE_API_SECRET || "my-super-secret";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const WA_MAX_LEN = 3800;
/** Fuseau horaire des rappels (.creneau) — Maroc */
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'Africa/Casablanca';

async function fetchProsFromApi(activeOnly = false) {
    const fetch = (await import('node-fetch')).default;
    const url = activeOnly
        ? `${SITE_URL}/api/bot/pros`
        : `${SITE_URL}/api/bot/pros?all=1`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${SITE_API_SECRET}` }
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.pros || [];
}

function formatProList(pros) {
    if (!pros.length) {
        return '📋 Aucun client pro enregistré.';
    }
    const lines = [`📋 *Clients Pros* (${pros.length})\n`];
    pros.forEach((p, i) => {
        const phone = normalizePhone(p.phone);
        const status = p.status === 'active' ? '✅ actif' : '⏸ inactif';
        lines.push(
            `${i + 1}. *${p.company}*`,
            `   👤 ${p.contact_name}`,
            `   📞 ${phone || '— sans numéro —'}`,
            `   ${status}`,
            ''
        );
    });
    lines.push('_Envoi : .prosend NUMERO : Votre message_');
    return lines.join('\n');
}

async function sendLongMessage(jid, text) {
    if (text.length <= WA_MAX_LEN) {
        await sock.sendMessage(jid, { text });
        return;
    }
    const chunks = [];
    let rest = text;
    while (rest.length > WA_MAX_LEN) {
        chunks.push(rest.slice(0, WA_MAX_LEN));
        rest = rest.slice(WA_MAX_LEN);
    }
    if (rest) chunks.push(rest);
    for (const chunk of chunks) {
        await sock.sendMessage(jid, { text: chunk });
        await new Promise(r => setTimeout(r, 400));
    }
}

function findProByPhone(pros, targetPhone) {
    const target = normalizePhone(targetPhone);
    return pros.find(p => normalizePhone(p.phone) === target);
}

const MENU_LOGO_PATH = path.join(__dirname, 'assets', 'nyclogo.png');

const ORDER_STATUS_LABELS = {
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée',
};

const PAYMENT_STATUS_LABELS = {
    pending: 'En attente',
    paid: 'Payé',
};

const PAYMENT_STATUS_ALIASES = {
    attente: 'pending',
    pending: 'pending',
    impaye: 'pending',
    paye: 'paid',
    payee: 'paid',
    paid: 'paid',
};

const INVOICE_STATUS_LABELS = {
    upcoming: 'À payer',
    paid: 'Payée',
    overdue: 'En retard',
};

function invoiceStatusLabel(status) {
    return INVOICE_STATUS_LABELS[status] || status || 'Inconnu';
}

const ORDER_STATUS_ALIASES = {
    attente: 'pending',
    en_attente: 'pending',
    pending: 'pending',
    prep: 'preparing',
    preparation: 'preparing',
    preparing: 'preparing',
    pret: 'ready',
    prete: 'ready',
    ready: 'ready',
    livre: 'delivered',
    livree: 'delivered',
    delivered: 'delivered',
    annule: 'cancelled',
    annulee: 'cancelled',
    cancelled: 'cancelled',
};

/** Commandes reconnues par le bot — tout le reste (ex. `.musique`) est ignoré. */
const BOT_COMMANDS = new Set([
    '.menu',
    '.guide', '.aide', '.help',
    '.authorise', '.authorize', '.autorise',
    '.unauthorise', '.unauthorize', '.unautorise',
    '.update',
    '.commandes', '.orders',
    '.commande', '.order',
    '.paiement', '.payment',
    '.statut', '.status',
    '.avancer', '.advance',
    '.stock', '.stocks',
    '.produits', '.products',
    '.ventes', '.ca', '.stats',
    '.demandes', '.demandespro',
    '.ping',
    '.creneau',
    '.pro',
    '.prosend',
]);

function isKnownBotCommand(cleanText, cmd) {
    if (BOT_COMMANDS.has(cmd)) return true;
    const prefixes = [
        '.authorise', '.authorize', '.autorise',
        '.unauthorise', '.unauthorize', '.unautorise',
        '.prosend',
        '.ping',
    ];
    return prefixes.some((p) => cleanText.startsWith(p));
}

const COMMAND_REACTION = '🍪';

async function reactToCommand(msg) {
    if (!sock || !msg?.key?.remoteJid) return;
    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: COMMAND_REACTION, key: msg.key },
        });
    } catch (err) {
        console.warn('[BOT] Réaction commande:', err.message);
    }
}

function getMenuText() {
    return [
        '🍪 *NYC Cookies — Commandes*',
        '',
        '*Général*',
        '`.menu`',
        '`.guide`',
        '`.ping`',
        '`.update`',
        '',
        '*Boutique — commandes*',
        '`.commandes`',
        '`.commande`',
        '`.statut`',
        '`.paiement`',
        '`.avancer`',
        '`.ventes`',
        '`.demandes`',
        '',
        '*Boutique — catalogue*',
        '`.stock`',
        '`.produits`',
        '',
        '*Clients pro*',
        '`.pro`',
        '`.prosend`',
        '`.creneau`',
        '',
        '*Administration*',
        '`.authorise`',
        '`.unauthorise`',
    ].join('\n');
}

function getGuideText() {
    return [
        '📖 *Guide des commandes — NYC Cookies*',
        '',
        '*Général*',
        '• `.menu` — Menu court (accueil)',
        '• `.guide` — Ce guide',
        '• `.ping` — Tester la connexion',
        '• `.update` — Résumé admin (commandes, factures, demandes pro)',
        '',
        '*Boutique — commandes*',
        '• `.commandes` — En attente (défaut)',
        '• `.commandes active` — En cours (attente + prépa + prête)',
        '• `.commande REF` — Détail d\'une commande',
        '• `.statut REF prep` — Statut (attente/prep/pret/livre/annule)',
        '• `.paiement REF paye` — Paiement (+ facture liée)',
        '• `.avancer REF` — Statut suivant',
        '• `.ventes` — CA et stats du jour (Maroc)',
        '• `.demandes` — Demandes compte pro en attente',
        '',
        '*Boutique — catalogue*',
        '• `.stock` — Stock bas (seuil 15)',
        '• `.stock 5` — Stock bas (seuil personnalisé)',
        '• `.produits` — Produits actifs',
        '',
        '*Clients pro*',
        '• `.pro` — Liste des pros',
        '• `.prosend NUMERO : Message` — Message à un pro',
        `• \`.creneau HH:mm\` — Rappels auto (${CRON_TIMEZONE})`,
        '',
        '*Administration*',
        '• `.authorise NUMERO` — Autoriser un numéro',
        '• `.unauthorise NUMERO` — Retirer un numéro',
        '',
        '*Exemples*',
        '`.commande ord_2026_0001`',
        '`.paiement ord_2026_0001 paye`',
        '`.prosend 212612345678 : Bonjour !`',
    ].join('\n');
}

async function getMenuLogoBuffer() {
    if (fs.existsSync(MENU_LOGO_PATH)) {
        return fs.readFileSync(MENU_LOGO_PATH);
    }
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(`${SITE_URL}/nyclogo.png`);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        console.warn('[BOT] Logo menu introuvable:', e.message);
    }
    return null;
}

async function notifyAllAdmins(message) {
    if (!isConnected || !sock) {
        return { sent: 0, failed: 0, total: 0, error: 'Bot non connecté' };
    }

    const phones = getAllAuthorizedPhones();
    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
        try {
            const jid = `${phone}@s.whatsapp.net`;
            await sock.sendMessage(jid, { text: message });
            sent++;
            console.log(`[BOT] Notification admin envoyée à ${phone}`);
            await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
            failed++;
            console.error(`[BOT] Échec notification vers ${phone}:`, err.message);
        }
    }

    return { sent, failed, total: phones.length };
}

function formatAdminSummary(data) {
    const unpaidCount = data.unpaidInvoicesCount ?? data.pendingInvoicesCount ?? 0;
    const lines = [
        '📊 *NYC Cookies — Mise à jour admin*',
        '',
        `🛒 Commandes en attente : *${data.pendingOrdersCount ?? 0}*`,
        `💼 Demandes Pro en attente : *${data.pendingProRequestsCount ?? 0}*`,
        `📦 Commandes aujourd'hui : *${data.ordersTodayCount ?? 0}*`,
        `🧾 Factures à payer : *${unpaidCount}*`,
        `⏰ Rappels pros : *${botConfig.cronTime}* (${CRON_TIMEZONE})`,
        '',
    ];

    if (data.pendingOrders?.length) {
        lines.push('*Dernières commandes en attente :*');
        data.pendingOrders.slice(0, 5).forEach((o) => {
            lines.push(`• ${o.reference} — ${o.total_mad} MAD (${o.customer_type})`);
        });
        lines.push('');
    }

    if (data.unpaidInvoices?.length) {
        lines.push('*Factures encore à payer :*');
        data.unpaidInvoices.forEach((inv) => {
            lines.push(`• ${inv.reference} — ${inv.amount_mad} MAD (${invoiceStatusLabel(inv.status)})`);
        });
        lines.push('');
    }

    if (data.pendingProRequests?.length) {
        lines.push('*Demandes Pro récentes :*');
        data.pendingProRequests.slice(0, 5).forEach((r) => {
            lines.push(`• ${r.company} — ${r.contact_name} (${r.phone})`);
        });
        lines.push('');
    }

    lines.push(`🔗 Admin : ${data.siteUrl}/admin/dashboard`);
    return lines.join('\n');
}

async function fetchAdminSummary() {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${SITE_URL}/api/bot/admin-summary`, {
        headers: { Authorization: `Bearer ${SITE_API_SECRET}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function fetchShop(action, params = {}) {
    const fetch = (await import('node-fetch')).default;
    const qs = new URLSearchParams({ action, ...params });
    const res = await fetch(`${SITE_URL}/api/bot/shop?${qs}`, {
        headers: { Authorization: `Bearer ${SITE_API_SECRET}` },
    });
    if (!res.ok) {
        const err = await res.text();
        if (res.status === 404) throw new Error('not_found');
        throw new Error(err);
    }
    return res.json();
}

async function patchShop(body) {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${SITE_URL}/api/bot/shop`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${SITE_API_SECRET}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (data.error === 'not_found') throw new Error('not_found');
        if (data.error === 'cannot_advance') throw new Error('cannot_advance');
        throw new Error(data.error || (await res.text()));
    }
    return data;
}

function parseOrderStatusInput(raw) {
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e');
    return ORDER_STATUS_ALIASES[key] || null;
}

function statusLabel(status) {
    return ORDER_STATUS_LABELS[status] || status || 'Inconnu';
}

function paymentLabel(payment) {
    return PAYMENT_STATUS_LABELS[payment] || payment || 'Inconnu';
}

function parsePaymentStatusInput(raw) {
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e');
    return PAYMENT_STATUS_ALIASES[key] || null;
}

/** Retire backticks / ponctuation WhatsApp autour de la référence commande. */
function sanitizeOrderRef(raw) {
    if (!raw) return '';
    return String(raw).replace(/^[`'"]+|[`'".:,;]+$/g, '').trim();
}

function formatOrdersList(data) {
    const filter = data.statusFilter === 'active' ? 'en cours' : data.statusFilter;
    const lines = [`🛒 *Commandes (${filter})*`, ''];
    if (!data.orders?.length) {
        lines.push('Aucune commande pour ce filtre.');
        return lines.join('\n');
    }
    data.orders.forEach((o) => {
        const date = new Date(o.created_at).toLocaleString('fr-MA', {
            timeZone: 'Africa/Casablanca',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        lines.push(
            `• *${o.reference}* — ${o.total_mad} MAD`,
            `  ${statusLabel(o.status)} · ${paymentLabel(o.payment)} · ${o.customer_type} · ${date}`,
        );
    });
    lines.push('', '`.commande REF` pour le détail');
    return lines.join('\n');
}

function formatOrderDetail(data) {
    const o = data.order;
    const clientLine = o.customerLabel
        ? `*Client pro :* ${o.customerLabel}`
        : `*Client :* ${o.customer_type}`;
    const lines = [
        `📦 *Commande ${o.reference}*`,
        '',
        `*Statut :* ${statusLabel(o.status)}`,
        `*Paiement :* ${paymentLabel(o.payment)}`,
        clientLine,
        `Total : *${o.total_mad} MAD*`,
        `Date : ${new Date(o.created_at).toLocaleString('fr-MA', { timeZone: 'Africa/Casablanca' })}`,
        '',
        '*Articles :*',
    ];
    o.items.forEach((i) => lines.push(`• ${i.qty}× ${i.name}`));
    lines.push('', '`.statut REF prep` · `.paiement REF paye` · `.avancer REF`');
    return lines.join('\n');
}

function formatStockList(data) {
    const lines = [`📉 *Stock bas (≤ ${data.threshold})*`, ''];
    if (!data.products?.length) {
        lines.push('✅ Tous les produits sont au-dessus du seuil.');
        return lines.join('\n');
    }
    data.products.forEach((p) => {
        lines.push(`• ${p.name} — *${p.stock}* restant(s) (${p.price_mad} MAD)`);
    });
    return lines.join('\n');
}

function formatProductsList(data) {
    const lines = ['🍪 *Produits actifs*', ''];
    if (!data.products?.length) {
        lines.push('Aucun produit actif.');
        return lines.join('\n');
    }
    data.products.forEach((p) => {
        const flag = p.stock <= 5 ? ' ⚠️' : '';
        lines.push(`• ${p.name} — ${p.price_mad} MAD · stock *${p.stock}*${flag}`);
    });
    return lines.join('\n');
}

function formatSalesStats(data) {
    const byStatus = data.byStatus || {};
    const statusLines = Object.entries(byStatus)
        .map(([s, n]) => `  ${statusLabel(s)} : ${n}`)
        .join('\n');
    return [
        `💰 *Ventes du ${data.dateMorocco}*`,
        '',
        `Commandes : *${data.ordersCount}*`,
        `Chiffre d'affaires : *${data.revenueMad} MAD*`,
        `En attente (total) : *${data.pendingCount}*`,
        '',
        '*Par statut aujourd\'hui :*',
        statusLines || '  —',
    ].join('\n');
}

function formatProRequestsList(data) {
    const lines = ['💼 *Demandes compte Pro en attente*', ''];
    if (!data.requests?.length) {
        lines.push('Aucune demande en attente.');
        return lines.join('\n');
    }
    data.requests.forEach((r) => {
        lines.push(`• *${r.company}*`, `  ${r.contact_name} — ${r.phone}`, `  ${r.email || '—'}`);
    });
    lines.push('', `🔗 ${SITE_URL}/admin/pros`);
    return lines.join('\n');
}

async function sendTextWithLogo(jid, text, logo = null) {
    const img = logo ?? (await getMenuLogoBuffer());
    if (img) {
        await sock.sendMessage(jid, { image: img, caption: text });
    } else {
        await sock.sendMessage(jid, { text });
    }
}

async function sendMenu(jid) {
    await sendTextWithLogo(jid, getMenuText());
}

async function sendGuide(jid) {
    await sendLongMessage(jid, getGuideText());
}

function parseCommandPhone(text, commandBase) {
    const trimmed = text.trim();
    const bases = [commandBase];
    if (commandBase === 'authorise') bases.push('authorize', 'autorise');
    if (commandBase === 'unauthorise') bases.push('unauthorize', 'unautorise', 'désauthorise', 'desauthorise');

    for (const base of bases) {
        const patterns = [
            new RegExp(`^\\.${base}\\s*\\((\\d{9,15})\\)`, 'i'),
            new RegExp(`^\\.${base}\\s+(\\d{9,15})`, 'i'),
        ];
        for (const pattern of patterns) {
            const match = trimmed.match(pattern);
            if (match) return normalizePhone(match[1]);
        }
    }
    return null;
}

function addAuthorizedPhone(phone) {
    if (!isValidPhoneDigits(phone)) {
        return { ok: false, message: '❌ Numéro invalide (9 à 13 chiffres, indicatif inclus).' };
    }
    if (phone === MANDATORY_ADMIN_PHONE) {
        return { ok: true, message: 'ℹ️ Ce numéro est déjà autorisé en permanence.' };
    }
    if (!botConfig.authorizedPhones.includes(phone)) {
        botConfig.authorizedPhones.push(phone);
        saveConfig();
        console.log(`[BOT] Numéro autorisé via commande : ${phone}`);
    }
    return { ok: true, message: `✅ ${phone} est maintenant autorisé.` };
}

function removeAuthorizedPhone(phone) {
    if (!isValidPhoneDigits(phone)) {
        return { ok: false, message: '❌ Numéro invalide (9 à 13 chiffres, indicatif inclus).' };
    }
    if (phone === MANDATORY_ADMIN_PHONE) {
        return { ok: false, message: '⛔ Ce numéro ne peut pas être retiré.' };
    }
    if (!botConfig.authorizedPhones.includes(phone)) {
        return { ok: false, message: `❌ ${phone} n'est pas dans la liste des numéros additionnels.` };
    }
    botConfig.authorizedPhones = botConfig.authorizedPhones.filter(p => p !== phone);
    saveConfig();
    console.log(`[BOT] Numéro retiré via commande : ${phone}`);
    return { ok: true, message: `✅ ${phone} n'est plus autorisé.` };
}

function extractText(msg) {
    if (!msg?.message) return '';
    const contentType = getContentType(msg.message);
    if (contentType === 'conversation') return msg.message.conversation || '';
    if (contentType === 'extendedTextMessage') return msg.message.extendedTextMessage?.text || '';
    if (contentType === 'imageMessage') return msg.message.imageMessage?.caption || '';
    if (contentType === 'videoMessage') return msg.message.videoMessage?.caption || '';
    return '';
}

async function handleIncomingMessages(m) {
    if (m.type && m.type !== 'notify') return;
    if (!m.messages?.length) return;

    for (const msg of m.messages) {
        try {
            if (!msg.message) continue;

            cacheLidFromMessage(msg.key);

            const text = extractText(msg);
            if (!text) continue;

            const sender = msg.key.remoteJid;
            const cleanText = text.trim().toLowerCase();
            const isCommand = cleanText.startsWith('.');

            if (!isCommand) continue;

            const cmd = cleanText.split(/\s+/)[0].split('(')[0].split(':')[0];

            if (!isKnownBotCommand(cleanText, cmd)) continue;

            await reactToCommand(msg);

            if (cmd === '.menu') {
                await sendMenu(sender);
                console.log('[BOT] Menu envoyé');
                continue;
            }

            if (cmd === '.guide' || cmd === '.aide' || cmd === '.help') {
                if (!isSenderAuthorized(msg)) {
                    await sock.sendMessage(sender, {
                        text: '⛔ Numéro non autorisé.\nTapez `.menu` pour l\'accueil.',
                    });
                    continue;
                }
                await sendGuide(sender);
                console.log('[BOT] Guide envoyé');
                continue;
            }

            if (!isSenderAuthorized(msg)) {
                const detected = resolveSenderPhone(msg);
                const raw = normalizePhone(msg.key.participant || msg.key.remoteJid);
                console.log(`[BOT] Commande refusée — numéro: ${detected || 'non résolu'} (jid brut: ${raw || 'inconnu'})`);
                await sock.sendMessage(sender, {
                    text: '⛔ Numéro non autorisé.\nTapez `.menu` ou `.guide` (si vous êtes admin).',
                });
                continue;
            }

            console.log(`[BOT] Commande autorisée de ${sender}: "${text}"`);

            if (cmd === '.authorise' || cleanText.startsWith('.authorize') || cleanText.startsWith('.autorise')) {
                const phone = parseCommandPhone(text, 'authorise');
                if (!phone) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: `.authorise NUMERO` ou `.authorise(NUMERO)`\nEx: `.authorise 212612345678`',
                    });
                    continue;
                }
                const result = addAuthorizedPhone(phone);
                await sock.sendMessage(sender, { text: result.message });
            } else if (
                cmd === '.unauthorise' ||
                cleanText.startsWith('.unauthorize') ||
                cleanText.startsWith('.unautorise')
            ) {
                const phone = parseCommandPhone(text, 'unauthorise');
                if (!phone) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: `.unauthorise NUMERO` ou `.unauthorise(NUMERO)`\nEx: `.unauthorise 212612345678`',
                    });
                    continue;
                }
                const result = removeAuthorizedPhone(phone);
                await sock.sendMessage(sender, { text: result.message });
            } else if (cmd === '.update') {
                try {
                    const summary = await fetchAdminSummary();
                    await sendLongMessage(sender, formatAdminSummary(summary));
                    console.log('[BOT] Résumé .update envoyé');
                } catch (err) {
                    console.error('[BOT] Erreur .update:', err);
                    await sock.sendMessage(sender, {
                        text: '❌ Impossible de récupérer les données du site. Vérifiez NEXT_PUBLIC_SITE_URL et SITE_API_SECRET.',
                    });
                }
            } else if (cmd === '.commandes' || cmd === '.orders') {
                try {
                    const parts = text.trim().split(/\s+/);
                    let status = 'pending';
                    if (parts[1]) {
                        const arg = parts[1].toLowerCase();
                        if (arg === 'active' || arg === 'actives' || arg === 'cours') status = 'active';
                        else if (arg === 'tout' || arg === 'all' || arg === 'toutes') status = 'all';
                        else {
                            const mapped = parseOrderStatusInput(arg);
                            if (mapped) status = mapped;
                        }
                    }
                    const data = await fetchShop('orders', { status, limit: '15' });
                    await sendLongMessage(sender, formatOrdersList(data));
                } catch (err) {
                    console.error('[BOT] Erreur .commandes:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer les commandes.' });
                }
            } else if (cmd === '.commande' || cmd === '.order') {
                const refMatch = text.trim().match(/^\.(?:commande|order)\s+(\S+)/i);
                if (!refMatch) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: `.commande REF`\nEx: `.commande ord_2026_0042`',
                    });
                    continue;
                }
                const orderRef = sanitizeOrderRef(refMatch[1]);
                try {
                    const data = await fetchShop('order', { reference: orderRef });
                    await sendLongMessage(sender, formatOrderDetail(data));
                } catch (err) {
                    const msg = err.message === 'not_found'
                        ? '❌ Commande introuvable.'
                        : '❌ Impossible de récupérer la commande.';
                    await sock.sendMessage(sender, { text: msg });
                }
            } else if (cmd === '.paiement' || cmd === '.payment') {
                const payMatch = text.trim().match(/^\.(?:paiement|payment)\s+(\S+)\s+(\S+)/i);
                if (!payMatch) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: `.paiement REF paye`\nValeurs: attente, paye',
                    });
                    continue;
                }
                const [, reference, paymentRaw] = payMatch;
                const payment = parsePaymentStatusInput(paymentRaw);
                if (!payment) {
                    await sock.sendMessage(sender, {
                        text: '❌ Paiement invalide. Utilisez: attente, paye',
                    });
                    continue;
                }
                try {
                    const result = await patchShop({
                        action: 'set-payment',
                        reference: sanitizeOrderRef(reference),
                        payment,
                    });
                    const note = result.unchanged ? ' (déjà à ce statut)' : '';
                    const factureNote =
                        result.payment === 'paid'
                            ? '\n🧾 Facture liée : *Payée*'
                            : '\n🧾 Facture liée : *À payer*';
                    await sock.sendMessage(sender, {
                        text: `✅ *${sanitizeOrderRef(reference)}*\n${paymentLabel(result.previousPayment)} → *${paymentLabel(result.payment)}*${note}${factureNote}`,
                    });
                } catch (err) {
                    const msg = err.message === 'not_found'
                        ? '❌ Commande introuvable.'
                        : '❌ Impossible de mettre à jour le paiement.';
                    await sock.sendMessage(sender, { text: msg });
                }
            } else if (cmd === '.statut' || cmd === '.status') {
                const statutMatch = text.trim().match(/^\.(?:statut|status)\s+(\S+)\s+(\S+)/i);
                if (!statutMatch) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: `.statut REF prep`\nStatuts: attente, prep, pret, livre, annule',
                    });
                    continue;
                }
                const [, reference, statusRaw] = statutMatch;
                const status = parseOrderStatusInput(statusRaw);
                if (!status) {
                    await sock.sendMessage(sender, {
                        text: '❌ Statut invalide. Utilisez: attente, prep, pret, livre, annule',
                    });
                    continue;
                }
                try {
                    const result = await patchShop({ action: 'set-status', reference: sanitizeOrderRef(reference), status });
                    const note = result.unchanged ? ' (déjà à ce statut)' : '';
                    await sock.sendMessage(sender, {
                        text: `✅ *${reference}*\n${statusLabel(result.previousStatus)} → *${statusLabel(result.status)}*${note}`,
                    });
                } catch (err) {
                    const msg = err.message === 'not_found'
                        ? '❌ Commande introuvable.'
                        : '❌ Impossible de mettre à jour le statut.';
                    await sock.sendMessage(sender, { text: msg });
                }
            } else if (cmd === '.avancer' || cmd === '.advance') {
                const advMatch = text.trim().match(/^\.(?:avancer|advance)\s+(\S+)/i);
                if (!advMatch) {
                    await sock.sendMessage(sender, { text: '❌ Format: `.avancer REF`' });
                    continue;
                }
                try {
                    const result = await patchShop({ action: 'advance', reference: sanitizeOrderRef(advMatch[1]) });
                    const note = result.unchanged ? '\nℹ️ Déjà au statut final du flux.' : '';
                    await sock.sendMessage(sender, {
                        text: `✅ *${result.reference}*\n${statusLabel(result.previousStatus)} → *${statusLabel(result.status)}*${note}`,
                    });
                } catch (err) {
                    let msg = '❌ Impossible d\'avancer la commande.';
                    if (err.message === 'not_found') msg = '❌ Commande introuvable.';
                    else if (err.message === 'cannot_advance') msg = '❌ Cette commande ne peut pas avancer (annulée ou hors flux).';
                    await sock.sendMessage(sender, { text: msg });
                }
            } else if (cmd === '.stock' || cmd === '.stocks') {
                try {
                    const parts = text.trim().split(/\s+/);
                    const threshold = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : '15';
                    const data = await fetchShop('stock', { threshold });
                    await sendLongMessage(sender, formatStockList(data));
                } catch (err) {
                    console.error('[BOT] Erreur .stock:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer les stocks.' });
                }
            } else if (cmd === '.produits' || cmd === '.products') {
                try {
                    const data = await fetchShop('products', { limit: '30' });
                    await sendLongMessage(sender, formatProductsList(data));
                } catch (err) {
                    console.error('[BOT] Erreur .produits:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer les produits.' });
                }
            } else if (cmd === '.ventes' || cmd === '.ca' || cmd === '.stats') {
                try {
                    const data = await fetchShop('stats');
                    await sock.sendMessage(sender, { text: formatSalesStats(data) });
                } catch (err) {
                    console.error('[BOT] Erreur .ventes:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer les ventes du jour.' });
                }
            } else if (cmd === '.demandes' || cmd === '.demandespro') {
                try {
                    const data = await fetchShop('pro-requests');
                    await sendLongMessage(sender, formatProRequestsList(data));
                } catch (err) {
                    console.error('[BOT] Erreur .demandes:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer les demandes pro.' });
                }
            } else if (cleanText.startsWith('.ping')) {
                await sock.sendMessage(sender, { text: '🤖 Bot est actif et connecté! Pong! ✅' });
                console.log(`[BOT] Réponse .ping envoyée à ${sender}`);
            } else if (cmd === '.creneau') {
                const timeMatch = text.trim().match(/\.creneau\s*:?\s*(\d{1,2}:\d{2})/i);
                if (timeMatch) {
                    const [, h, m] = timeMatch[1].match(/^(\d{1,2}):(\d{2})$/) || [];
                    const normalized = `${h.padStart(2, '0')}:${m}`;
                    botConfig.cronTime = normalized;
                    saveConfig();
                    setupCron();
                    await sock.sendMessage(sender, {
                        text: `✅ Créneau d'envoi : ${botConfig.cronTime} (heure du Maroc — ${CRON_TIMEZONE})`,
                    });
                } else {
                    await sock.sendMessage(sender, {
                        text: `❌ Format invalide. Utilisez: .creneau HH:mm\nExemple: .creneau 15:00\nActuel : ${botConfig.cronTime}`,
                    });
                }
            } else if (cleanText === '.pro') {
                try {
                    const pros = await fetchProsFromApi(false);
                    await sendLongMessage(sender, formatProList(pros));
                } catch (err) {
                    console.error('[BOT] Erreur .pro:', err);
                    await sock.sendMessage(sender, { text: '❌ Impossible de récupérer la liste des pros.' });
                }
            } else if (cleanText.startsWith('.prosend')) {
                const match = text.trim().match(/^\.prosend\s+\(?(\d{9,15})\)?\s*:\s*(.+)$/is);
                if (!match) {
                    await sock.sendMessage(sender, {
                        text: '❌ Format: .prosend NUMERO : Message\nExemple: .prosend 212612345678 : Bonjour, votre commande est prête.'
                    });
                    continue;
                }
                const [, targetPhone, messageBody] = match;
                const message = messageBody.trim();
                if (!message) {
                    await sock.sendMessage(sender, { text: '❌ Le message ne peut pas être vide.' });
                    continue;
                }
                try {
                    const pros = await fetchProsFromApi(false);
                    const pro = findProByPhone(pros, targetPhone);
                    if (!pro) {
                        await sock.sendMessage(sender, {
                            text: `❌ Aucun pro trouvé avec le numéro ${normalizePhone(targetPhone)}. Utilisez .pro pour voir la liste.`
                        });
                        continue;
                    }
                    const phone = normalizePhone(pro.phone);
                    if (!phone) {
                        await sock.sendMessage(sender, { text: `❌ ${pro.company} n'a pas de numéro WhatsApp enregistré.` });
                        continue;
                    }
                    const jid = `${phone}@s.whatsapp.net`;
                    await sock.sendMessage(jid, { text: message });
                    await sock.sendMessage(sender, {
                        text: `✅ Message envoyé à *${pro.company}* (${phone}).`
                    });
                    console.log(`[BOT] .prosend → ${pro.company} (${phone})`);
                } catch (err) {
                    console.error('[BOT] Erreur .prosend:', err);
                    await sock.sendMessage(sender, { text: '❌ Échec de l\'envoi du message au pro.' });
                }
            }
        } catch (err) {
            console.error('[BOT] Erreur traitement message:', err);
        }
    }
}

function clearAuthSession() {
    if (fs.existsSync('auth_info_baileys')) {
        try {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
            console.log('[BOT] Session auth_info_baileys supprimée.');
        } catch (err) {
            console.error('[BOT] Impossible de supprimer auth_info_baileys :', err);
        }
    }
}

function hasRegisteredSession() {
    try {
        const credsPath = path.join('auth_info_baileys', 'creds.json');
        if (!fs.existsSync(credsPath)) return false;
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        return Boolean(creds?.me?.id);
    } catch {
        return false;
    }
}

function isQrExpiredError(error) {
    if (!error) return false;
    const statusCode = error?.output?.statusCode;
    const msg = String(error?.message || error?.output?.payload?.message || '');
    return statusCode === 408 || msg.includes('QR refs');
}

async function destroySocket() {
    const old = sock;
    sock = null;
    if (!old) return;
    try {
        old.ev.removeAllListeners('connection.update');
        old.ev.removeAllListeners('creds.update');
        old.ev.removeAllListeners('messages.upsert');
        old.ev.removeAllListeners('lid-mapping.update');
        await old.end(undefined);
    } catch (e) {
        console.warn('[BOT] Fermeture socket :', e.message);
    }
}

function cancelScheduledReconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleReconnect(method, phoneNumber, delayMs, { clearAuth = false } = {}) {
    cancelScheduledReconnect();
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        isLinking = false;
        qrError = 'Trop de tentatives de connexion. Cliquez sur « Générer le QR » pour recommencer.';
        console.error('[BOT] Limite de reconnexions atteinte.');
        return;
    }
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectToWhatsApp(method, phoneNumber, { force: true, clearAuth });
    }, delayMs);
}

async function connectToWhatsApp(method = 'qr', phoneNumber = '', options = {}) {
    const { force = false, clearAuth = false } = options;

    if (isConnected && sock && !force) return;
    if (isLinking && !force) return;

    cancelScheduledReconnect();
    isLinking = true;
    linkMethod = method;
    linkPhone = phoneNumber;
    if (force) qrError = null;

    await destroySocket();

    if (clearAuth) {
        clearAuthSession();
        currentQrBase64 = null;
        pairingCode = null;
    } else if (force) {
        pairingCode = null;
    }

    console.log(`[BOT] Connexion WhatsApp (${method})${clearAuth ? ' — session réinitialisée' : ''}...`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        let version = [2, 3000, 1017578768];
        try {
            const latest = await fetchLatestBaileysVersion();
            version = latest.version;
            console.log(`[BOT] Version WhatsApp Web : v${version.join('.')}`);
        } catch (e) {
            console.warn('[BOT] Version en ligne indisponible, version par défaut.');
        }

        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ['Windows', 'Chrome', '110.0.5481.100'],
            qrTimeout: 60000,
            connectTimeoutMs: 60000,
        });

        if (method === 'pairing_code' && phoneNumber && !sock.authState.creds.me) {
            setTimeout(async () => {
                if (!sock || isConnected) return;
                try {
                    console.log(`[BOT] Code d'association pour : ${phoneNumber}`);
                    const code = await sock.requestPairingCode(phoneNumber);
                    pairingCode = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log('[BOT] Code d\'association généré.');
                } catch (err) {
                    console.error('[BOT] Erreur code d\'association :', err);
                    qrError = 'Impossible de générer le code. Vérifiez le numéro et réessayez.';
                    isLinking = false;
                }
            }, 3000);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && method === 'qr') {
                try {
                    currentQrBase64 = await qrcode.toDataURL(qr);
                    qrError = null;
                    reconnectAttempts = 0;
                    console.log('[BOT] Nouveau QR disponible pour l\'interface.');
                } catch (err) {
                    console.error('[BOT] Erreur QR Base64 :', err);
                }
            }

            if (connection === 'close') {
                isConnected = false;
                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;
                const qrExpired = isQrExpiredError(error);

                console.error(`[BOT] Connexion fermée (${statusCode}). QR expiré: ${qrExpired}`);
                if (error) console.error('[BOT] Détail:', error.message || error);

                await destroySocket();

                if (loggedOut) {
                    isLinking = false;
                    currentQrBase64 = null;
                    pairingCode = null;
                    qrError = null;
                    reconnectAttempts = 0;
                    clearAuthSession();
                    return;
                }

                if (qrExpired) {
                    console.log('[BOT] QR expiré — nouvelle session dans 3s');
                    if (method === 'qr') currentQrBase64 = null;
                    scheduleReconnect(method, phoneNumber, 3000, { clearAuth: true });
                    return;
                }

                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    const delay = statusCode === DisconnectReason.restartRequired ? 1500 : 5000;
                    scheduleReconnect(method, phoneNumber, delay, { clearAuth: false });
                } else {
                    isLinking = false;
                    currentQrBase64 = null;
                    pairingCode = null;
                }
            } else if (connection === 'open') {
                console.log('[BOT] Connecté à WhatsApp.');
                isConnected = true;
                isLinking = false;
                currentQrBase64 = null;
                pairingCode = null;
                qrError = null;
                reconnectAttempts = 0;
                cancelScheduledReconnect();

                try {
                    const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await sock.sendMessage(jid, { text: 'Bot NYC Cookies connecté avec succès ! ✅' });
                } catch (err) {
                    console.error('[BOT] Message de confirmation :', err);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('lid-mapping.update', (update) => {
            if (!update || typeof update !== 'object') return;
            if (Array.isArray(update)) {
                for (const entry of update) {
                    if (entry?.lid && entry?.pn) storeLidMapping(entry.lid, entry.pn);
                }
            } else {
                for (const [lid, pn] of Object.entries(update)) {
                    storeLidMapping(lid, pn);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            await handleIncomingMessages(m);
        });

    } catch (error) {
        console.error('[BOT] Erreur initialisation connexion :', error);
        isLinking = false;
        qrError = 'Erreur de connexion. Réessayez via « Générer le QR ».';
        await destroySocket();
    }
}

function setupCron() {
    if (cronJob) {
        cronJob.stop();
    }

    const [hour, minute] = botConfig.cronTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    console.log(`[CRON] Rappels planifiés à ${botConfig.cronTime} (${CRON_TIMEZONE}) — expression: ${cronExpression}`);

    cronJob = cron.schedule(cronExpression, async () => {
        const nowMa = new Date().toLocaleString('fr-MA', { timeZone: CRON_TIMEZONE });
        console.log(`[CRON] Déclenché à ${nowMa} (${CRON_TIMEZONE})`);
        if (!isConnected || !sock) {
            console.log("[CRON] Bot is not connected. Skipping.");
            return;
        }

        try {
            const pros = await fetchProsFromApi(true);

            console.log(`[CRON] Found ${pros.length} active pros to message.`);

            const logo = await getMenuLogoBuffer();
            if (!logo) {
                console.warn('[CRON] Logo NYC introuvable — envoi texte seul.');
            }

            for (const pro of pros) {
                if (!pro.phone) continue;

                const cleanNumber = pro.phone.replace(/\D/g, '');
                const jid = `${cleanNumber}@s.whatsapp.net`;
                const message = `Bonjour ${pro.contact_name},\n\nC'est l'heure de commander vos NYC Cookies pour demain ! 🍪\n\nPassez commande directement sur votre espace pro :\n${SITE_URL}/pro/dashboard\n\nMerci et bonne soirée !`;

                await sendTextWithLogo(jid, message, logo);
                console.log(`[CRON] Sent message to ${pro.company} (${pro.phone})`);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            console.log("[CRON] Finished sending messages.");

        } catch (err) {
            console.error("[CRON] Error during cron execution", err);
        }
    }, { timezone: CRON_TIMEZONE });
}

setTimeout(() => {
    if (hasRegisteredSession()) {
        console.log('[BOT] Session enregistrée détectée — reconnexion automatique.');
        connectToWhatsApp('qr');
    }
    setupCron();
}, 5000);

app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        connecting: isLinking && !isConnected,
        qr: currentQrBase64,
        pairingCode: pairingCode,
        qrError: qrError,
        cronTime: botConfig.cronTime,
        ...getStatusPhonesPayload(),
    });
});

app.post('/api/start', async (req, res) => {
    const { method, phone } = req.body;

    if (isConnected) {
        return res.json({ success: true, message: 'Already connected' });
    }

    if (method === 'pairing_code' && !phone) {
        return res.status(400).json({ error: 'Phone number required for pairing code' });
    }

    cancelScheduledReconnect();
    reconnectAttempts = 0;
    qrError = null;

    const useMethod = method || 'qr';
    const clearAuthOnStart =
        useMethod === 'qr' || useMethod === 'pairing_code' || !hasRegisteredSession();

    await connectToWhatsApp(useMethod, phone || '', {
        force: true,
        clearAuth: clearAuthOnStart,
    });

    res.json({ success: true, message: 'Started connection process' });
});

app.post('/api/logout', async (req, res) => {
    console.log('[BOT] Déconnexion et réinitialisation.');
    cancelScheduledReconnect();
    reconnectAttempts = 0;
    isLinking = false;
    qrError = null;

    if (sock) {
        try {
            await sock.logout();
        } catch (e) {
            console.warn('[BOT] Logout socket :', e.message);
        }
    }
    await destroySocket();
    isConnected = false;
    currentQrBase64 = null;
    pairingCode = null;

    if (fs.existsSync('auth_info_baileys')) {
        try {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
            console.log('[BOT] Dossier session supprimé.');
        } catch (err) {
            console.error("[BOT] Impossible de supprimer le dossier de session :", err);
        }
    }

    res.json({ success: true, message: "Logged out and session cleared" });
});

app.post('/api/set-cron', (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    const { time } = req.body;
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: "Invalid time format (HH:mm expected)" });
    }

    botConfig.cronTime = time;
    saveConfig();
    setupCron();

    res.json({
        success: true,
        message: "Cron updated successfully",
        time: botConfig.cronTime,
        cronTimezone: CRON_TIMEZONE,
    });
});

app.post('/api/set-authorized-phone', (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    const normalized = normalizePhone(req.body?.phone);
    if (!normalized || normalized.length < 9 || normalized.length > 15) {
        return res.status(400).json({ error: "Numéro invalide (indicatif + numéro, ex: 212612345678)" });
    }

    if (normalized === MANDATORY_ADMIN_PHONE) {
        return res.json({
            success: true,
            message: "Ce numéro est déjà autorisé en permanence.",
            ...getStatusPhonesPayload(),
        });
    }

    if (!botConfig.authorizedPhones.includes(normalized)) {
        botConfig.authorizedPhones.push(normalized);
        saveConfig();
    }

    console.log(`[BOT] Numéro admin ajouté : ${normalized}`);

    res.json({
        success: true,
        message: "Numéro ajouté à la liste autorisée",
        ...getStatusPhonesPayload(),
    });
});

app.post('/api/remove-authorized-phone', (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    const normalized = normalizePhone(req.body?.phone);
    if (!normalized) {
        return res.status(400).json({ error: "Numéro requis" });
    }

    if (normalized === MANDATORY_ADMIN_PHONE) {
        return res.status(400).json({
            error: `Le numéro ${MANDATORY_ADMIN_PHONE} est obligatoire et ne peut pas être supprimé.`,
        });
    }

    botConfig.authorizedPhones = botConfig.authorizedPhones.filter(p => p !== normalized);
    saveConfig();
    console.log(`[BOT] Numéro admin retiré : ${normalized}`);

    res.json({
        success: true,
        message: "Numéro retiré de la liste",
        ...getStatusPhonesPayload(),
    });
});

app.post('/api/clear-authorized-phone', (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    botConfig.authorizedPhones = [];
    saveConfig();
    console.log('[BOT] Numéros additionnels supprimés (obligatoire conservé)');

    res.json({
        success: true,
        message: "Numéros additionnels supprimés. Le numéro obligatoire reste actif.",
        ...getStatusPhonesPayload(),
    });
});

app.post('/api/notify-admins', async (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "message parameter is required" });
    }

    try {
        const result = await notifyAllAdmins(message);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error("Error notify-admins:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/send-message', async (req, res) => {
    if (!verifyApiSecret(req, res)) return;

    const { phone, message, broadcast } = req.body;

    if (!message) {
        return res.status(400).json({ error: "message parameter is required" });
    }

    if (!isConnected || !sock) {
        return res.status(503).json({ error: "WhatsApp Bot is not connected" });
    }

    try {
        if (broadcast === true || !phone) {
            const result = await notifyAllAdmins(message);
            return res.json({ success: true, ...result });
        }

        const cleanNumber = phone.replace(/\D/g, '');
        const jid = `${cleanNumber}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true, message: "Message sent successfully", phone: cleanNumber });
    } catch (err) {
        console.error("Error sending message via API:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Bot API running on port ${PORT}`);
});
