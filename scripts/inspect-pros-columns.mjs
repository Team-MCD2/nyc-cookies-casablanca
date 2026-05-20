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

async function inspect() {
  const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const prosSchema = data.definitions?.pros;
    if (prosSchema) {
      console.log("=== PROS SCHEMA ===");
      console.log("Properties:", Object.keys(prosSchema.properties));
    } else {
      console.log("✗ Could not find 'pros' definition in OpenAPI schema.");
    }
  } catch (error) {
    console.error("✗ Fetch error:", error);
  }
}

inspect();
