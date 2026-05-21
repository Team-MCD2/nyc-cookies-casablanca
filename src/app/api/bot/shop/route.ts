import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "preparing", "ready", "delivered", "cancelled"] as const;
const VALID_PAYMENTS = ["pending", "paid"] as const;
const FLOW = ["pending", "preparing", "ready", "delivered"] as const;

function checkAuth(req: Request) {
  const secret = process.env.SITE_API_SECRET || "my-super-secret";
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return false;
  }
  return true;
}

function moroccoDayStartIso(): string {
  const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });
  return `${dateStr}T00:00:00+01:00`;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const sb = createAdminClient();

  if (action === "orders") {
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 30);

    let query = sb
      .from("orders")
      .select("reference, total_mad, status, customer_type, payment, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "active") {
      query = query.in("status", ["pending", "preparing", "ready"]);
    } else if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data ?? [], statusFilter: status });
  }

  if (action === "order") {
    const reference = searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    const { data: order, error } = await sb
      .from("orders")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const items = (order.items ?? []) as { pid: string; qty: number }[];
    const ids = [...new Set(items.map((i) => i.pid))];
    let productNames: Record<string, string> = {};

    if (ids.length) {
      const { data: products } = await sb.from("products").select("id, name").in("id", ids);
      productNames = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
    }

    const lineItems = items.map((i) => ({
      pid: i.pid,
      name: productNames[i.pid] || i.pid,
      qty: i.qty,
    }));

    let customerLabel: string | null = null;
    if (order.pro_id) {
      const { data: pro } = await sb.from("pros").select("company, phone").eq("id", order.pro_id).maybeSingle();
      customerLabel = pro ? `${pro.company} (${pro.phone || "—"})` : null;
    } else if (order.customer_id) {
      const { data: cust } = await sb
        .from("customers")
        .select("name, phone")
        .eq("id", order.customer_id)
        .maybeSingle();
      customerLabel = cust ? `${cust.name} (${cust.phone || "—"})` : null;
    }

    return NextResponse.json({
      order: {
        reference: order.reference,
        status: order.status,
        payment: order.payment,
        customer_type: order.customer_type,
        total_mad: order.total_mad,
        created_at: order.created_at,
        customerLabel,
        items: lineItems,
      },
    });
  }

  if (action === "stock") {
    const threshold = parseInt(searchParams.get("threshold") || "15", 10);
    const { data, error } = await sb
      .from("products")
      .select("id, name, stock, active, price_mad")
      .eq("active", true)
      .lte("stock", threshold)
      .order("stock", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [], threshold });
  }

  if (action === "products") {
    const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 50);
    const { data, error } = await sb
      .from("products")
      .select("id, name, stock, price_mad, active")
      .eq("active", true)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  }

  if (action === "stats") {
    const since = moroccoDayStartIso();
    const { data: orders, error } = await sb
      .from("orders")
      .select("total_mad, status, customer_type")
      .gte("created_at", since);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = orders ?? [];
    const revenue = list.reduce((s, o) => s + (o.total_mad ?? 0), 0);
    const byStatus: Record<string, number> = {};
    for (const o of list) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }

    const { count: pendingCount } = await sb
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({
      dateMorocco: new Date().toLocaleDateString("fr-MA", { timeZone: "Africa/Casablanca" }),
      ordersCount: list.length,
      revenueMad: revenue,
      byStatus,
      pendingCount: pendingCount ?? 0,
    });
  }

  if (action === "pro-requests") {
    const { data, error } = await sb
      .from("pro_requests")
      .select("id, company, contact_name, phone, email, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data ?? [] });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; reference?: string; status?: string; payment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, reference } = body;
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data: cur, error: fetchErr } = await sb
    .from("orders")
    .select("status, payment")
    .eq("reference", reference)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!cur) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "set-payment") {
    const payment = body.payment;
    if (!payment || !VALID_PAYMENTS.includes(payment as (typeof VALID_PAYMENTS)[number])) {
      return NextResponse.json({ error: "invalid_payment" }, { status: 400 });
    }
    if (payment === cur.payment) {
      return NextResponse.json({
        reference,
        previousPayment: cur.payment,
        payment: cur.payment,
        unchanged: true,
      });
    }
    const { error: payErr } = await sb.from("orders").update({ payment }).eq("reference", reference);
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    const { data: ord } = await sb.from("orders").select("id").eq("reference", reference).maybeSingle();
    if (ord?.id) {
      if (payment === "paid") {
        await sb.from("invoices").update({ status: "paid" }).eq("order_id", ord.id);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const { data: invs } = await sb.from("invoices").select("id, due_date").eq("order_id", ord.id);
        for (const inv of invs ?? []) {
          const invStatus = inv.due_date < today ? "overdue" : "upcoming";
          await sb.from("invoices").update({ status: invStatus }).eq("id", inv.id);
        }
      }
    }

    return NextResponse.json({
      reference,
      previousPayment: cur.payment,
      payment,
    });
  }

  let nextStatus: string;

  if (action === "advance") {
    const idx = FLOW.indexOf(cur.status as (typeof FLOW)[number]);
    if (idx < 0) {
      return NextResponse.json({ error: "cannot_advance", previousStatus: cur.status }, { status: 400 });
    }
    nextStatus = FLOW[Math.min(idx + 1, FLOW.length - 1)];
  } else if (action === "set-status") {
    const status = body.status;
    if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    nextStatus = status;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (nextStatus === cur.status) {
    return NextResponse.json({
      reference,
      previousStatus: cur.status,
      status: cur.status,
      unchanged: true,
    });
  }

  const { error: updateErr } = await sb.from("orders").update({ status: nextStatus }).eq("reference", reference);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    reference,
    previousStatus: cur.status,
    status: nextStatus,
  });
}
