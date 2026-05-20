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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspect() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
  console.log("Fetching PostgREST OpenAPI schema from:", supabaseUrl);
  try {
    const res = await fetch(url);
    const data = await res.json();
    const invoiceSchema = data.definitions?.invoices;
    if (invoiceSchema) {
      console.log("=== INVOICES SCHEMA ===");
      console.log("Properties:", Object.keys(invoiceSchema.properties));
      console.log("Required fields:", invoiceSchema.required);
      console.log("Full definitions of properties:");
      for (const [col, info] of Object.entries(invoiceSchema.properties)) {
        console.log(` - ${col}: type=${info.type}, format=${info.format}, description=${info.description}`);
      }
    } else {
      console.log("✗ Could not find 'invoices' definition in OpenAPI schema.");
    }
  } catch (error) {
    console.error("✗ Fetch error:", error);
  }
}

inspect();
