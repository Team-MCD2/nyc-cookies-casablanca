import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

async function fetchBotStatus() {
  const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "http://localhost:3057";
  const res = await fetch(`${botUrl}/api/status`, {
    headers: {
      "x-api-secret": process.env.SITE_API_SECRET || "",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Bot status ${res.status}`);
  }
  return res.json();
}

/** Masque le numéro obligatoire côté dashboard (reste actif sur le bot). */
function sanitizeForAdmin(data: Record<string, unknown>) {
  const { mandatoryPhone: _hidden, authorizedPhone: _legacy, ...rest } = data;
  const additionalPhones = (data.additionalPhones as string[] | undefined) ?? [];
  return {
    ...rest,
    additionalPhones,
    authorizedPhones: additionalPhones,
  };
}

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    const data = await fetchBotStatus();

    if (action === "get-authorized-phone") {
      return NextResponse.json({
        authorizedPhones: data.additionalPhones ?? [],
        additionalPhones: data.additionalPhones ?? [],
      });
    }

    return NextResponse.json(sanitizeForAdmin(data));
  } catch (error: unknown) {
    console.error("Error connecting to WhatsApp bot:", error);
    return NextResponse.json({ error: "Bot is unreachable" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "http://localhost:3057";
  const apiSecret = process.env.SITE_API_SECRET || "";

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action) {
    return NextResponse.json(
      { error: "Paramètre action requis (ex: ?action=set-authorized-phone)" },
      { status: 400 },
    );
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const routes: Record<string, string> = {
    start: "/api/start",
    logout: "/api/logout",
    "set-cron": "/api/set-cron",
    "set-authorized-phone": "/api/set-authorized-phone",
    "remove-authorized-phone": "/api/remove-authorized-phone",
    "clear-authorized-phone": "/api/clear-authorized-phone",
  };

  const botPath = routes[action];
  if (!botPath) {
    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${botUrl}${botPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": apiSecret,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const errorText = await res.text();
    if (!res.ok) {
      let payload: { error: string } = { error: errorText || "Bot request failed" };
      try {
        payload = JSON.parse(errorText);
      } catch {
        /* raw text */
      }

      if (res.status === 404) {
        payload.error =
          "Endpoint introuvable sur le bot Kerm. Mettez à jour bot/index.js et redémarrez le serveur.";
      }

      return NextResponse.json(payload, { status: res.status });
    }

    try {
      const parsed = JSON.parse(errorText);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return NextResponse.json(sanitizeForAdmin(parsed as Record<string, unknown>));
      }
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ success: true, message: errorText });
    }
  } catch (error: unknown) {
    console.error("Error posting to WhatsApp bot:", error);
    return NextResponse.json({ error: "Bot is unreachable" }, { status: 502 });
  }
}
