/**
 * Envoi de notifications WhatsApp à tous les numéros admin autorisés (via le bot Kerm).
 */
export async function notifyAdmins(message: string): Promise<void> {
  const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL;
  const apiSecret = process.env.SITE_API_SECRET;
  if (!botUrl || !apiSecret) return;

  try {
    await fetch(`${botUrl}/api/notify-admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSecret}`,
        "x-api-secret": apiSecret,
      },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.error("Error sending WhatsApp notification to admins:", err);
  }
}
