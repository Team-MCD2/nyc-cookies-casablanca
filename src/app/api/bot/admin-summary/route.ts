import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SITE_API_SECRET || "my-super-secret";

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminClient();

  const [
    { data: pendingOrders },
    { data: pendingProRequests },
    { count: ordersToday },
  ] = await Promise.all([
    sb
      .from("orders")
      .select("reference, total_mad, status, customer_type, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("pro_requests")
      .select("id, company, contact_name, phone, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().slice(0, 10)),
  ]);

  const { data: invoiceRows } = await sb
    .from("invoices")
    .select("reference, status, amount_mad, orders(payment)");

  const unpaidInvoices = (invoiceRows ?? []).filter((inv) => {
    if (inv.status === "paid") return false;
    const orderPayment = (inv.orders as { payment?: string } | null)?.payment;
    if (orderPayment === "paid") return false;
    return true;
  });

  return NextResponse.json({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    pendingOrders: pendingOrders ?? [],
    pendingOrdersCount: pendingOrders?.length ?? 0,
    pendingProRequests: pendingProRequests ?? [],
    pendingProRequestsCount: pendingProRequests?.length ?? 0,
    ordersTodayCount: ordersToday ?? 0,
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoices: unpaidInvoices.slice(0, 5).map((inv) => ({
      reference: inv.reference,
      status: inv.status,
      amount_mad: inv.amount_mad,
    })),
  });
}
