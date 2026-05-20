import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ----- Load .env.local manually -----
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("→ Testing B2C invoice insert (pro_id = null)...");
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb.from("invoices").insert({
    reference: `TEST-INV-B2C-${Date.now()}`,
    pro_id: null,
    issue_date: today,
    due_date: today,
    amount_mad: 100,
    status: "paid"
  }).select("*");

  if (error) {
    console.error("✗ Insert failed with error:", error.message);
  } else {
    console.log("✓ Success! B2C invoice inserted successfully:", data);
    // Cleanup
    await sb.from("invoices").delete().eq("id", data[0].id);
    console.log("✓ Cleanup done.");
  }
}

testInsert();
