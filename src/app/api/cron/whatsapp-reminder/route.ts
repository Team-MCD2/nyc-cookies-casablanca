import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";

// Securing the cron route, typically using a secret token if deployed.
// For Vercel Cron, you check the request header:
// const authHeader = req.headers.get('authorization');
// if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

export async function GET(req: Request) {
  try {
    const sb = createAdminClient();
    
    // Fetch all active Pros
    const { data: pros, error } = await sb
      .from("pros")
      .select("id, contact_name, phone, status")
      .eq("status", "active");

    if (error) {
      console.error("Failed to fetch pros:", error);
      return NextResponse.json({ error: "Failed to fetch pros" }, { status: 500 });
    }

    if (!pros || pros.length === 0) {
      return NextResponse.json({ message: "No active pros to notify." });
    }

    // Prepare the message template
    const shopUrl = `${SITE.url}/pro/order`;
    const results = [];

    // Send messages via the local or remote bot service
    const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "http://localhost:3001";
    
    for (const pro of pros) {
      if (!pro.phone) continue;

      const message = `Bonjour ${pro.contact_name},\n\nTu as besoin de quoi pour demain ?\n\nVoici le lien pour passer ta commande :\n${shopUrl}\n\nMerci,\nL'équipe NYC Cookies`;
      
      try {
        const response = await fetch(`${botUrl}/api/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: pro.phone,
            message: message,
          }),
        });

        const result = await response.json();
        results.push({ proId: pro.id, phone: pro.phone, status: response.ok ? "success" : "failed", result });
      } catch (err) {
        console.error(`Failed to reach bot for pro ${pro.id}:`, err);
        results.push({ proId: pro.id, phone: pro.phone, status: "error", error: String(err) });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron execution error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
