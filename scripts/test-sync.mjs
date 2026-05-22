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

async function loadProStatsMap(sb) {
  const map = new Map();

  const { data: orders, error: oErr } = await sb
    .from("orders")
    .select("pro_id, total_mad")
    .eq("customer_type", "pro")
    .not("pro_id", "is", null);
  if (oErr) console.error("oErr:", oErr);

  for (const o of orders ?? []) {
    const id = o.pro_id;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.ordersCount += 1;
    cur.totalSpent += o.total_mad ?? 0;
    map.set(id, cur);
  }

  const { data: invoices, error: iErr } = await sb
    .from("invoices")
    .select("pro_id, amount_mad, status")
    .not("pro_id", "is", null)
    .in("status", ["upcoming", "overdue"]);
  if (iErr) console.error("iErr:", iErr);

  for (const inv of invoices ?? []) {
    const id = inv.pro_id;
    const cur = map.get(id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    cur.outstanding += inv.amount_mad ?? 0;
    map.set(id, cur);
  }

  return map;
}

async function testSync() {
  const stats = await loadProStatsMap(sb);
  const { data: pros, error: pErr } = await sb.from("pros").select("id");
  if (pErr) console.error("pErr:", pErr);

  for (const p of pros ?? []) {
    const s = stats.get(p.id) ?? { ordersCount: 0, totalSpent: 0, outstanding: 0 };
    console.log(`Updating pro ${p.id} with stats:`, s);
    const { data, error } = await sb
      .from("pros")
      .update({
        orders_count: s.ordersCount,
        total_spent: s.totalSpent,
        outstanding_mad: s.outstanding,
      })
      .eq("id", p.id)
      .select();
    if (error) {
      console.error(`Error updating pro ${p.id}:`, error);
    } else {
      console.log(`Success updating pro ${p.id}:`, data);
    }
  }

  const { data: prosFinal } = await sb.from("pros").select("*");
  console.log("FINAL PROS IN DB:", prosFinal);
}

testSync().catch(console.error);
