// =============================================================================
//  scripts/create-admin.mjs
//  Crée un compte admin Clerk (email + mot de passe + rôle admin).
//
//  L'authentification de l'app passe par Clerk, pas Supabase Auth.
//  Exécuter depuis la racine du projet :
//
//    npm run create-admin
//    npm run create-admin -- nyccookies.casa@gmail.com nyc2026
// =============================================================================

import { createClerkClient } from "@clerk/backend";
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

const email = process.argv[2]?.trim() || "nyccookies.casa@gmail.com";
const password = process.argv[3] || "nyc2026";

/** Clerk exige parfois un username selon la config de l'instance. */
function usernameFromEmail(addr) {
  const local = (addr.split("@")[0] ?? "admin").toLowerCase();
  const base = local.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return (base || "nyc_admin").slice(0, 32);
}

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey || !secretKey.startsWith("sk_")) {
  console.error("✗ CLERK_SECRET_KEY manquant ou invalide dans .env.local");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

console.log(`→ Recherche d'un compte existant pour ${email}…`);

const list = await clerk.users.getUserList({ emailAddress: [email] });
const existing = (Array.isArray(list) ? list : list?.data ?? [])[0];

if (existing) {
  const prev = existing.publicMetadata?.role ?? "(aucun)";
  await clerk.users.updateUser(existing.id, {
    publicMetadata: { ...(existing.publicMetadata ?? {}), role: "admin" },
  });
  console.log(`
✓ Compte déjà présent — rôle admin appliqué
  email        : ${email}
  user_id      : ${existing.id}
  rôle précéd. : ${prev}
  rôle actuel  : admin

⚠  Si le mot de passe doit être réinitialisé, utilisez Clerk Dashboard
    → Users → ${email} → Reset password.
    Sinon connectez-vous avec le mot de passe déjà défini.
`);
  process.exit(0);
}

const username = usernameFromEmail(email);

const user = await clerk.users.createUser({
  emailAddress: [email],
  username,
  password,
  skipPasswordChecks: true,
  firstName: "NYC",
  lastName: "Cookies",
  publicMetadata: { role: "admin" },
});

console.log(`
✓ Compte admin créé
  email     : ${email}
  username  : ${username}
  user_id   : ${user.id}
  rôle      : admin
  connexion : https://nyc-cookies-casablanca.vercel.app/login

⚠  Déconnectez-vous puis reconnectez-vous si une session était déjà ouverte.
`);
