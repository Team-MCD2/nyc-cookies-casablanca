import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "http://localhost:3057";

  try {
    const res = await fetch(`${botUrl}/api/status`, {
      headers: {
        "x-api-secret": process.env.SITE_API_SECRET || "",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Bot returned non-OK status" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
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

  let body = null;
  try {
    body = await req.json();
  } catch (e) {}

  let targetUrl = `${botUrl}/api/start`;
  if (action === "logout") {
    targetUrl = `${botUrl}/api/logout`;
  } else if (action === "set-cron") {
    targetUrl = `${botUrl}/api/set-cron`;
  } else if (action === "set-authorized-phone") {
    targetUrl = `${botUrl}/api/set-authorized-phone`;
  }

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-secret": apiSecret,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json({ error: errorText || "Bot request failed" }, { status: res.status });
      }
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error posting to WhatsApp bot:", error);
    return NextResponse.json({ error: "Bot is unreachable" }, { status: 502 });
  }
}
