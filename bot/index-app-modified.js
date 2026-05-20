const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
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

// Ensure auth directory exists
if (!fs.existsSync('auth_info_baileys')) {
    fs.mkdirSync('auth_info_baileys');
}

// Config file
const CONFIG_FILE = path.join(__dirname, 'bot_config.json');
let botConfig = { cronTime: "20:00" };
if (fs.existsSync(CONFIG_FILE)) {
    try {
        botConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) { console.error("Error reading config", e); }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig));
}

// Secret to authenticate calls to Next.js
const SITE_API_SECRET = process.env.SITE_API_SECRET || "my-super-secret";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function connectToWhatsApp(method = 'qr', phoneNumber = '') {
    // If already connected, do nothing
    if (isConnected && sock) return;

    currentQrBase64 = null;
    pairingCode = null;

    console.log(`[BOT] Tentative de connexion WhatsApp via méthode : ${method}...`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        // Obtenir la dernière version de WhatsApp Web pour éviter le rejet du protocole par WhatsApp
        let version = [2, 3000, 1017578768]; // Version de secours
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
            // Toujours définir un navigateur réaliste (Chrome sur Windows) pour éviter le blocage/déconnexion immédiate
            browser: ["Windows", "Chrome", "110.0.5481.100"]
        });

        if (method === 'pairing_code' && phoneNumber) {
            // Attendre un court instant avant de demander le code d'association
            setTimeout(async () => {
                try {
                    console.log(`[BOT] Demande du code d'association pour le numéro : ${phoneNumber}`);
                    let code = await sock.requestPairingCode(phoneNumber);
                    pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log("[BOT] Code d'association généré :", pairingCode);
                    console.log("[BOT] Pairing code stocké dans la variable globale");
                } catch (err) {
                    console.error("[BOT] Erreur lors de la demande de code d'association :", err);
                    pairingCode = null;
                }
            }, 2000);
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

            // Demander le pairing code si la méthode est pairing_code et pas encore généré
            if (method === 'pairing_code' && phoneNumber && !pairingCode && connection !== 'close') {
                try {
                    console.log(`[BOT] Demande du code d'association via connection.update pour : ${phoneNumber}`);
                    let code = await sock.requestPairingCode(phoneNumber);
                    pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log("[BOT] Code d'association généré via connection.update :", pairingCode);
                } catch (err) {
                    console.error("[BOT] Erreur lors de la demande du pairing code :", err);
                }
            }

            if (connection === 'close') {
                isConnected = false;
                currentQrBase64 = null;
                pairingCode = null;

                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.error(`[BOT] Connexion fermée. Code d'état : ${statusCode}. Reconnexion automatique : ${shouldReconnect}`);
                if (error) {
                    console.error("[BOT] Détails de l'erreur de déconnexion :", error);
                }
                
                if (shouldReconnect) {
                    // Reconnexion avec la même méthode et les mêmes arguments
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

                // Envoyer un message de confirmation à soi-même pour valider
                try {
                    const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await sock.sendMessage(jid, { text: "Bot NYC Cookies connecté avec succès ! ✅" });
                } catch (err) {
                    console.error("[BOT] Impossible d'envoyer le message de confirmation :", err);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async (m) => {
            console.log('[BOT] Nouveaux messages reçus');
            
            for (const msg of m.messages) {
                try {
                    if (!msg.message) continue; // Ignore les messages vides
                    
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                    if (!text) continue;
                    
                    const sender = msg.key.remoteJid;
                    const isFromMe = msg.key.fromMe;
                    
                    if (isFromMe) continue; // Ignore nos propres messages
                    
                    console.log(`[BOT] Message de ${sender}: ${text}`);
                    
                    // Parse commands
                    if (text.startsWith('.ping')) {
                        console.log(`[BOT] Commande .ping reçue de ${sender}`);
                        await sock.sendMessage(sender, { text: '🤖 Bot est actif et connecté! Pong! ✅' });
                    } else if (text.startsWith('.creneau')) {
                        const parts = text.split(' ');
                        if (parts.length === 2 && /^\d{2}:\d{2}$/.test(parts[1])) {
                            botConfig.cronTime = parts[1];
                            saveConfig();
                            setupCron();
                            console.log(`[BOT] Créneau changé à ${botConfig.cronTime} par ${sender}`);
                            await sock.sendMessage(sender, { text: `✅ Créneau d'envoi changé à ${botConfig.cronTime}` });
                        } else {
                            await sock.sendMessage(sender, { text: '❌ Format invalide. Utilisez: .creneau HH:mm\nExemple: .creneau 15:00' });
                        }
                    }
                } catch (err) {
                    console.error('[BOT] Erreur lors du traitement du message:', err);
                }
            }
        });

    } catch (error) {
        console.error("[BOT] Erreur critique lors de l'initialisation de la connexion :", error);
        // Retenter après un délai
        setTimeout(() => connectToWhatsApp(method, phoneNumber), 5000);
    }
}

// Start cron job
function setupCron() {
    if (cronJob) {
        cronJob.stop();
    }

    // Parse cronTime HH:mm
    const [hour, minute] = botConfig.cronTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    console.log(`Setting up cron job to run at ${botConfig.cronTime} (${cronExpression})`);
    
    cronJob = cron.schedule(cronExpression, async () => {
        console.log(`[CRON] Triggered at ${new Date().toISOString()}`);
        if (!isConnected || !sock) {
            console.log("[CRON] Bot is not connected. Skipping.");
            return;
        }

        try {
            // Fetch pros from Next.js site
            const fetch = (await import('node-fetch')).default;
            const res = await fetch(`${SITE_URL}/api/bot/pros`, {
                headers: { 'Authorization': `Bearer ${SITE_API_SECRET}` }
            });
            
            if (!res.ok) {
                console.error("[CRON] Failed to fetch pros from Next.js API:", await res.text());
                return;
            }

            const data = await res.json();
            const pros = data.pros || [];
            
            console.log(`[CRON] Found ${pros.length} active pros to message.`);

            for (const pro of pros) {
                if (!pro.phone) continue;
                
                const cleanNumber = pro.phone.replace(/\D/g, '');
                const jid = `${cleanNumber}@s.whatsapp.net`;
                
                // Construct message
                const message = `Bonjour ${pro.contact_name},\n\nC'est l'heure de commander vos NYC Cookies pour demain ! 🍪\n\nPassez commande directement sur votre espace pro :\n${SITE_URL}/pro/dashboard\n\nMerci et bonne soirée !`;
                
                await sock.sendMessage(jid, { text: message });
                console.log(`[CRON] Sent message to ${pro.company} (${pro.phone})`);
                
                // Wait 2 seconds to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            console.log("[CRON] Finished sending messages.");

        } catch (err) {
            console.error("[CRON] Error during cron execution", err);
        }
    });
}

// Initial setup
// Wait 5 seconds before attempting to connect to avoid quick crash loops
setTimeout(() => {
    // If auth info exists, try to connect immediately without specific method
    if (fs.existsSync('auth_info_baileys/creds.json')) {
        connectToWhatsApp('qr');
    }
    setupCron();
}, 5000);

// API Endpoints

app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        qr: currentQrBase64,
        pairingCode: pairingCode,
        cronTime: botConfig.cronTime
    });
});

app.post('/api/start', async (req, res) => {
    const { method, phone } = req.body; // method: 'qr' | 'pairing_code'
    
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
    }
    
    // Supprimer de force les credentials de session
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
    const { time } = req.body;
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ error: "Invalid time format (HH:mm expected)" });
    }

    botConfig.cronTime = time;
    saveConfig();
    setupCron();

    res.json({ success: true, message: "Cron updated successfully", time: botConfig.cronTime });
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
