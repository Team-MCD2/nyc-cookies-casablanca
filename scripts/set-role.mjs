// =============================================================================
//  scripts/set-role.mjs
//  Bumps a Clerk user's publicMetadata.role so they can access /admin or /pro.
//
//  Usage:
//    npm run set-role -- admin you@example.com
//    npm run set-role -- pro   buyer@cafe.ma
//    npm run set-role -- b2c   regular@example.com
// =============================================================================

import { createClerkClient } from "@clerk/backend";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ----- Load .env.local manually (no dotenv dep) ------------------------------
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

// ----- Parse args ------------------------------------------------------------
const [, , roleArg, ...rest] = process.argv;
const role = roleArg?.toLowerCase();
const email = rest.join(" ").trim();

const VALID_ROLES = ["admin", "pro", "b2c"];

if (!role || !email || !VALID_ROLES.includes(role)) {
  console.error(`
Usage:
  npm run set-role -- <${VALID_ROLES.join("|")}> <email>

Examples:
  npm run set-role -- admin you@example.com
  npm run set-role -- pro    contact@bricoli.ma
`);
  process.exit(1);
}

// ----- Sanity check secret ---------------------------------------------------
const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey || secretKey.includes("xxx") || !secretKey.startsWith("sk_")) {
  console.error("✗ CLERK_SECRET_KEY missing or invalid in .env.local");
  console.error("  Get it from Clerk Dashboard → API Keys → Secret keys.");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

// ----- Lookup + update -------------------------------------------------------
console.log(`→ Looking up Clerk user with email "${email}"…`);

const list = await clerk.users.getUserList({ emailAddress: [email] });
const users = Array.isArray(list) ? list : list?.data ?? [];
const user = users[0];

if (!user) {
  console.error(`\n✗ No Clerk user with email "${email}".`);
  console.error("  → Sign up first via http://localhost:3000/signup, then re-run.\n");
  process.exit(1);
}

const previousRole = user.publicMetadata?.role ?? "(none, defaults to b2c)";

await clerk.users.updateUser(user.id, {
  publicMetadata: { ...(user.publicMetadata ?? {}), role },
});

const dest =
  role === "admin"
    ? "/admin/dashboard"
    : role === "pro"
      ? "/pro/dashboard"
      : "/shop";

console.log(`
✓ Updated Clerk user
  email        : ${email}
  user_id      : ${user.id}
  previous role: ${previousRole}
  new role     : ${role}
  redirect to  : ${dest}

⚠  Important: SIGN OUT and SIGN BACK IN in the browser, otherwise the old
    session token (which still says role=${previousRole}) will be used.
`);
