import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(url, key, { auth: { persistSession: false } });

async function check() {
  const { data: orders, error: oErr } = await sb
    .from("orders")
    .select("pro_id, total_mad")
    .eq("customer_type", "pro")
    .not("pro_id", "is", null);
  
  console.log("oErr:", oErr);
  console.log("ORDERS QUERY LENGTH:", orders?.length);
  console.log("ORDERS:", orders);

  const { data: invoices, error: iErr } = await sb
    .from("invoices")
    .select("pro_id, amount_mad, status")
    .not("pro_id", "is", null)
    .in("status", ["upcoming", "overdue"]);

  console.log("iErr:", iErr);
  console.log("INVOICES QUERY LENGTH:", invoices?.length);
  console.log("INVOICES:", invoices);

  // Compute map
  const map = new Map();
  for (const o of orders ?? []) {
    const id = o.pro_id;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.ordersCount += 1;
    cur.totalSpent += o.total_mad ?? 0;
    map.set(id, cur);
  }

  for (const inv of invoices ?? []) {
    const id = inv.pro_id;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.outstanding += inv.amount_mad ?? 0;
    map.set(id, cur);
  }

  console.log("MAP RESULT:");
  for (const [k, v] of map.entries()) {
    console.log(k, "=>", v);
  }
}

check().catch(console.error);
