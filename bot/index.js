const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
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

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        // When using pairing code, browser is needed
        browser: method === 'pairing_code' ? ["Ubuntu", "Chrome", "20.0.04"] : undefined
    });

    if (method === 'pairing_code' && phoneNumber && !sock.authState.creds.me) {
        // Wait a bit before requesting code
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("Pairing code: ", pairingCode);
            } catch (err) {
                console.error("Error requesting pairing code", err);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && method === 'qr') {
            currentQrBase64 = await qrcode.toDataURL(qr);
            isConnected = false;
            console.log('New QR code generated.');
        }

        if (connection === 'close') {
            isConnected = false;
            currentQrBase64 = null;
            pairingCode = null;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp('qr'), 5000);
            } else {
                // If logged out, we should delete the auth info folder to allow clean restart
                fs.rmSync('auth_info_baileys', { recursive: true, force: true });
                console.log("Logged out. Cleaned auth info.");
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
            isConnected = true;
            currentQrBase64 = null;
            pairingCode = null;

            // Send confirmation message to self
            try {
                const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await sock.sendMessage(jid, { text: "Bot NYC Cookies connecté avec succès ! ✅" });
            } catch (err) {
                console.error("Could not send confirmation message", err);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
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
    if (sock) {
        await sock.logout();
        isConnected = false;
        currentQrBase64 = null;
        pairingCode = null;
    }
    res.json({ success: true, message: "Logged out" });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Bot API running on port ${PORT}`);
});
