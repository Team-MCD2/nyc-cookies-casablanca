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

function getMenuText() {
    return [
        '🍪 *NYC Cookies — Bot WhatsApp*',
        '',
        '*Commandes disponibles :*',
        '',
        '• `.menu` — Afficher ce menu',
        '• `.ping` — Tester la connexion',
        '• `.pro` — Liste des clients pro (numéros)',
        '• `.prosend NUMERO : Message` — Message personnalisé à un pro',
        `• \`.creneau HH:mm\` — Rappels auto (heure Maroc, ${CRON_TIMEZONE})`,
        '• `.authorise NUMERO` — Autoriser un numéro admin',
        '• `.unauthorise NUMERO` — Retirer l\'autorisation d\'un numéro',
        '',
        '*Exemples :*',
        '`.authorise 212612345678`',
        '`.authorise(33762641473)`',
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

async function sendMenu(jid) {
    const caption = getMenuText();
    const logo = await getMenuLogoBuffer();
    if (logo) {
        await sock.sendMessage(jid, { image: logo, caption });
    } else {
        await sock.sendMessage(jid, { text: caption });
    }
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

            const cmd = cleanText.split(/\s+/)[0].replace(/[(:].*$/, '');

            if (cmd === '.menu') {
                await sendMenu(sender);
                console.log('[BOT] Menu envoyé');
                continue;
            }

            if (!isSenderAuthorized(msg)) {
                const detected = resolveSenderPhone(msg);
                const raw = normalizePhone(msg.key.participant || msg.key.remoteJid);
                console.log(`[BOT] Commande refusée — numéro: ${detected || 'non résolu'} (jid brut: ${raw || 'inconnu'})`);
                await sock.sendMessage(sender, {
                    text: '⛔ Numéro non autorisé. Tapez `.menu` pour voir les commandes (si vous êtes admin).',
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
            } else if (cleanText.startsWith('.ping')) {
                await sock.sendMessage(sender, { text: '🤖 Bot est actif et connecté! Pong! ✅' });
                console.log(`[BOT] Réponse .ping envoyée à ${sender}`);
            } else if (cleanText.startsWith('.creneau')) {
                const parts = text.trim().split(' ');
                if (parts.length === 2 && /^\d{2}:\d{2}$/.test(parts[1])) {
                    botConfig.cronTime = parts[1];
                    saveConfig();
                    setupCron();
                    await sock.sendMessage(sender, {
                        text: `✅ Créneau d'envoi : ${botConfig.cronTime} (heure du Maroc — ${CRON_TIMEZONE})`,
                    });
                } else {
                    await sock.sendMessage(sender, { text: '❌ Format invalide. Utilisez: .creneau HH:mm\nExemple: .creneau 15:00' });
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

async function connectToWhatsApp(method = 'qr', phoneNumber = '') {
    if (isConnected && sock) return;

    currentQrBase64 = null;
    pairingCode = null;

    console.log(`[BOT] Tentative de connexion WhatsApp via méthode : ${method}...`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        let version = [2, 3000, 1017578768];
        try {
            const latest = await fetchLatestBaileysVersion();
            version = latest.version;
            console.log(`[BOT] Version WhatsApp Web détectée : v${version.join('.')}`);
        } catch (e) {
            console.warn("[BOT] Impossible de récupérer la version en ligne, utilisation de la version par défaut.");
        }

        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ["Windows", "Chrome", "110.0.5481.100"]
        });

        if (method === 'pairing_code' && phoneNumber && !sock.authState.creds.me) {
            setTimeout(async () => {
                try {
                    console.log(`[BOT] Demande du code d'association pour le numéro : ${phoneNumber}`);
                    const code = await sock.requestPairingCode(phoneNumber);
                    pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log("[BOT] Code d'association généré :", pairingCode);
                } catch (err) {
                    console.error("[BOT] Erreur lors de la demande de code d'association :", err);
                }
            }, 3000);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && method === 'qr') {
                try {
                    currentQrBase64 = await qrcode.toDataURL(qr);
                    isConnected = false;
                    console.log('[BOT] Nouveau code QR généré.');
                } catch (err) {
                    console.error("[BOT] Erreur de génération du code QR Base64 :", err);
                }
            }

            if (connection === 'close') {
                isConnected = false;
                currentQrBase64 = null;
                pairingCode = null;
                sock = null;

                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.error(`[BOT] Connexion fermée. Code d'état : ${statusCode}. Reconnexion automatique : ${shouldReconnect}`);
                if (error) {
                    console.error("[BOT] Détails de l'erreur de déconnexion :", error);
                }

                if (shouldReconnect) {
                    const delay = statusCode === DisconnectReason.restartRequired ? 1000 : 5000;
                    setTimeout(() => connectToWhatsApp(method, phoneNumber), delay);
                } else {
                    console.log("[BOT] Déconnexion complète détectée. Nettoyage de la session.");
                    try {
                        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
                        console.log("[BOT] Répertoire auth_info_baileys supprimé avec succès.");
                    } catch (err) {
                        console.error("[BOT] Impossible de supprimer le répertoire de session :", err);
                    }
                }
            } else if (connection === 'open') {
                console.log('[BOT] Connexion établie avec succès avec WhatsApp ! 🎉');
                isConnected = true;
                currentQrBase64 = null;
                pairingCode = null;

                try {
                    const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await sock.sendMessage(jid, { text: "Bot NYC Cookies connecté avec succès ! ✅" });
                } catch (err) {
                    console.error("[BOT] Impossible d'envoyer le message de confirmation :", err);
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

        // Écoute des messages entrants (commandes .ping, .creneau, etc.)
        sock.ev.on('messages.upsert', async (m) => {
            await handleIncomingMessages(m);
        });

    } catch (error) {
        console.error("[BOT] Erreur critique lors de l'initialisation de la connexion :", error);
        setTimeout(() => connectToWhatsApp(method, phoneNumber), 5000);
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

            for (const pro of pros) {
                if (!pro.phone) continue;

                const cleanNumber = pro.phone.replace(/\D/g, '');
                const jid = `${cleanNumber}@s.whatsapp.net`;
                const message = `Bonjour ${pro.contact_name},\n\nC'est l'heure de commander vos NYC Cookies pour demain ! 🍪\n\nPassez commande directement sur votre espace pro :\n${SITE_URL}/pro/dashboard\n\nMerci et bonne soirée !`;

                await sock.sendMessage(jid, { text: message });
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
    if (fs.existsSync('auth_info_baileys/creds.json')) {
        connectToWhatsApp('qr');
    }
    setupCron();
}, 5000);

app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        qr: currentQrBase64,
        pairingCode: pairingCode,
        cronTime: botConfig.cronTime,
        ...getStatusPhonesPayload(),
    });
});

app.post('/api/start', async (req, res) => {
    const { method, phone } = req.body;

    if (isConnected) {
        return res.json({ success: true, message: "Already connected" });
    }

    if (method === 'pairing_code' && !phone) {
        return res.status(400).json({ error: "Phone number required for pairing code" });
    }

    await connectToWhatsApp(method, phone);
    res.json({ success: true, message: "Started connection process" });
});

app.post('/api/logout', async (req, res) => {
    console.log("[BOT] Demande de déconnexion et réinitialisation de la session.");
    if (sock) {
        try {
            await sock.logout();
        } catch (e) {
            console.warn("[BOT] Échec du logout du socket (déjà déconnecté ou inexistant) :", e.message);
        }
        isConnected = false;
        currentQrBase64 = null;
        pairingCode = null;
        sock = null;
    }

    if (fs.existsSync('auth_info_baileys')) {
        try {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
            console.log("[BOT] Suppression forcée du dossier de session effectuée.");
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

app.post('/api/send-message', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${SITE_API_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: "Phone and message parameters are required" });
    }

    if (!isConnected || !sock) {
        return res.status(503).json({ error: "WhatsApp Bot is not connected" });
    }

    try {
        const cleanNumber = phone.replace(/\D/g, '');
        const jid = `${cleanNumber}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
        console.error("Error sending message via API:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Bot API running on port ${PORT}`);
});
