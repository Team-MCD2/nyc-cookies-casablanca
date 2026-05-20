const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let currentQrBase64 = null;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Suppress detailed logs
        printQRInTerminal: true, // Still print in terminal for debug
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Generate base64 QR code to send to the frontend
            currentQrBase64 = await qrcode.toDataURL(qr);
            isConnected = false;
            console.log('New QR code generated.');
        }

        if (connection === 'close') {
            isConnected = false;
            currentQrBase64 = null;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
            isConnected = true;
            currentQrBase64 = null; // Clear QR once connected
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Start connection
connectToWhatsApp();

// API Endpoints

app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        qr: currentQrBase64
    });
});

app.post('/api/send', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(503).json({ error: 'WhatsApp bot is not connected' });
    }

    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({ error: 'Missing "to" or "message" in body' });
    }

    try {
        // WhatsApp IDs usually need to be formatted as number@s.whatsapp.net
        // Strip non-digits from the number
        const cleanNumber = to.replace(/\D/g, '');
        const jid = `${cleanNumber}@s.whatsapp.net`;
        
        await sock.sendMessage(jid, { text: message });
        
        res.json({ success: true, message: 'Sent' });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Bot API running on port ${PORT}`);
});
