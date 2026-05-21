/**
 * Notifications WhatsApp via le bot Kerm.
 */

function botConfig() {
  const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL;
  const apiSecret = process.env.SITE_API_SECRET;
  if (!botUrl || !apiSecret) return null;
  return { botUrl, apiSecret };
}

function botHeaders(apiSecret: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiSecret}`,
    "x-api-secret": apiSecret,
  };
}

export async function notifyAdmins(message: string): Promise<void> {
  const cfg = botConfig();
  if (!cfg) return;

  try {
    await fetch(`${cfg.botUrl}/api/notify-admins`, {
      method: "POST",
      headers: botHeaders(cfg.apiSecret),
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.error("Error sending WhatsApp notification to admins:", err);
  }
}

/** Envoie un message WhatsApp à un numéro (société pro, client, etc.). */
export async function sendWhatsAppToPhone(phone: string, message: string): Promise<boolean> {
  const cfg = botConfig();
  if (!cfg) return false;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return false;

  try {
    const res = await fetch(`${cfg.botUrl}/api/send-message`, {
      method: "POST",
      headers: botHeaders(cfg.apiSecret),
      body: JSON.stringify({ phone: digits, message }),
    });
    return res.ok;
  } catch (err) {
    console.error("Error sending WhatsApp to phone:", err);
    return false;
  }
}
