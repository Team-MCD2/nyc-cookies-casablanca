// =============================================================================
//  scripts/seed-catalog.mjs
//  Insère ou met à jour le catalogue officiel dans Supabase.
//
//    npm run seed-catalog
// =============================================================================

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

if (!url || !key) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env.local");
  process.exit(1);
}

const CATALOG = [
  ["p_brooklyn", "Brooklyn", "Les Iconiques — 100% chocolat et brownie — intense, fondant, pur cacao.", "cookie", 25, 42],
  ["p_harlem", "Harlem", "Les Iconiques — Chocolat & noix, fondant et croquant.", "cookie", 25, 37],
  ["p_times_square", "Times Square", "Les Iconiques — Cœur chocolat intense, nutella.", "cookie", 25, 55],
  ["p_rikers", "Rikers Island", "Les Audacieux — Crème spéculoos, cœur chocolat blanc, lotus.", "cookie", 28, 29],
  ["p_bronx", "Bronx", "Les Audacieux — Cœur Milka caramel, chocolat caramel.", "cookie", 28, 33],
  ["p_staten_island", "Staten Island", "Les Audacieux — Cœur pépites de chocolat, chocolat blanc Kinder Maxi.", "cookie", 28, 18],
  ["p_soho", "Soho", "Les Élite — Crème Kunafa citron, zeste de citron vert et framboise.", "cookie", 32, 22],
  ["p_little_italy", "Little Italy", "Les Élite — Tiramisu, cœur mascarpone, touche cacao.", "cookie", 32, 15],
  ["p_central_park", "Central Park", "Les Élite — Cœur pomme, cannelle et caramel.", "cookie", 32, 27],
  ["p_pink_velvet", "Pink Velvet", "Les Gourmets — Red velvet, cœur crème cheese, chocolat blanc et framboise.", "cookie", 35, 12],
  ["p_wall_street", "Wall Street", "Les Gourmets — Cœur crème Bueno, chocolat Kinder Bueno.", "cookie", 35, 19],
  ["p_madison_square", "Madison Square", "Les Gourmets — Cœur crème pistache, framboise et éclats de pistache.", "cookie", 35, 8],
  ["p_grand_cookie", "Grand Cookie Signature", "Formats partenaire — Format standard, toutes saveurs (tarif partenaire).", "box", 15, 200],
  ["p_mini_cookie", "Mini Cookie", "Formats partenaire — Réplique miniature des saveurs signature (tarif partenaire).", "box", 9, 200],
];

const RETIRED = [
  "p_central", "p_times", "p_madison", "p_pinkv", "p_italy", "p_full",
  "p_box_m", "p_box_xl", "p_icecream",
];

const sb = createClient(url, key, { auth: { persistSession: false } });

const rows = CATALOG.map(([id, name, description, category, price_mad, stock]) => ({
  id,
  name,
  description,
  category,
  price_mad,
  stock,
  active: true,
  image_url: null,
}));

const { error } = await sb.from("products").upsert(rows, { onConflict: "id" });
if (error) {
  console.error("Upsert catalogue:", error.message);
  process.exit(1);
}

const { error: retireErr } = await sb
  .from("products")
  .update({ active: false })
  .in("id", RETIRED);
if (retireErr) {
  console.warn("Désactivation anciens produits:", retireErr.message);
}

console.log(`✓ ${rows.length} produits catalogue synchronisés.`);
console.log(`✓ ${RETIRED.length} anciens produits désactivés (si présents).`);
