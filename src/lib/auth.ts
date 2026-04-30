import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["admin", "pro", "b2c"];

function coerceRole(value: unknown): Role | null {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value)
    ? (value as Role)
    : null;
}

/**
 * Resolve the current Clerk session + role.
 *
 * Role detection is robust to Clerk's session-token configuration:
 *  1. First try sessionClaims.metadata.role (fast, requires custom session
 *     token claim on Clerk Dashboard → Sessions).
 *  2. Fallback to currentUser().publicMetadata.role (one extra Clerk fetch,
 *     but works even when no custom claim is configured).
 *
 * Default = "b2c" for any signed-in user without a role assigned.
 */
export async function getCurrentSession() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const fromClaim = coerceRole(
    (sessionClaims?.metadata as { role?: unknown } | undefined)?.role,
  );
  if (fromClaim) return { userId, role: fromClaim };

  const user = await currentUser();
  const fromMetadata = coerceRole(
    (user?.publicMetadata as { role?: unknown } | undefined)?.role,
  );
  return { userId, role: fromMetadata ?? "b2c" };
}

/** Redirect helper — sends to login if not authenticated. */
export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

/** Only allow specific roles, redirects to role's home otherwise. */
export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.role)) redirect(roleHome(session.role));
  return session;
}

export function roleHome(role: Role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "pro") return "/pro/dashboard";
  return "/account";
}

/** Lookup the customer/pro row matching the current Clerk user. */
export async function getCustomerForUser(userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("customers").select("*").eq("clerk_user_id", userId).maybeSingle();
  return data;
}

export async function getProForUser(userId: string) {
  const sb = createAdminClient();
  const { data } = await sb.from("pros").select("*").eq("clerk_user_id", userId).maybeSingle();
  return data;
}

// ----------------------------------------------------------------------------
// Lazy provisioning — keep Supabase in sync with Clerk identities
// ----------------------------------------------------------------------------

interface ClerkLite {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  publicMetadata: Record<string, unknown>;
  unsafeMetadata: Record<string, unknown>;
}

function flatten(u: any): ClerkLite {
  return {
    id: u.id,
    fullName: u.fullName ?? null,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    username: u.username ?? null,
    primaryEmail:
      u.primaryEmailAddress?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress ?? null,
    primaryPhone: u.primaryPhoneNumber?.phoneNumber ?? null,
    publicMetadata: (u.publicMetadata ?? {}) as Record<string, unknown>,
    unsafeMetadata: (u.unsafeMetadata ?? {}) as Record<string, unknown>,
  };
}

function pickName(u: ClerkLite): string {
  const composed = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return (
    u.fullName ||
    composed ||
    u.username ||
    u.primaryEmail?.split("@")[0] ||
    "Sans nom"
  );
}

/**
 * Idempotent: ensures a `customers` row exists for the current Clerk user
 * (only when their role is "b2c"). Called from the public layout so that any
 * B2C user who signs in shows up immediately in the admin "Clients B2C" page —
 * even before they place their first order.
 *
 * No-op for admin / pro roles (those are managed via separate flows).
 */
export async function ensureCustomerRow() {
  const session = await getCurrentSession();
  if (!session || session.role !== "b2c") return;

  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("customers")
    .select("id")
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  if (existing) return;

  const { currentUser } = await import("@clerk/nextjs/server");
  const raw = await currentUser();
  if (!raw) return;
  const u = flatten(raw);

  await sb.from("customers").insert({
    clerk_user_id: u.id,
    name: pickName(u),
    email: u.primaryEmail ?? "",
    phone: u.primaryPhone,
  });
}

/**
 * Same idea as ensureCustomerRow, but for pros. Triggers when a Clerk user
 * signs in with role="pro" but no matching `pros` row (e.g. account created
 * directly from the Clerk dashboard, bypassing the invitation flow).
 *
 * Defaults are placeholder-friendly so the admin can still see the user in
 * /admin/pros and complete the missing fields (company, ICE, address…) later.
 */
export async function ensureProRow() {
  const session = await getCurrentSession();
  if (!session || session.role !== "pro") return;

  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("pros")
    .select("id")
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  if (existing) return;

  const { currentUser } = await import("@clerk/nextjs/server");
  const raw = await currentUser();
  if (!raw) return;
  const u = flatten(raw);

  const company =
    (u.publicMetadata.company as string | undefined) ||
    (u.unsafeMetadata.company as string | undefined) ||
    pickName(u);
  const contact =
    (u.unsafeMetadata.contactName as string | undefined) || pickName(u);

  await sb.from("pros").insert({
    clerk_user_id: u.id,
    company,
    contact_name: contact,
    email: u.primaryEmail ?? "",
    phone: u.primaryPhone,
    payment_terms_days: 30,
    status: "active",
  });
}

/**
 * If the current user signed up via /pro-invite, finalise their onboarding:
 *   - Promote their Clerk role to "pro" (publicMetadata.role)
 *   - Create the pros row from the invitation (company, contact_name)
 *   - Mark the invitation as consumed
 *
 * Idempotent. Safe to call on every public layout render.
 */
export async function consumePendingInvitation() {
  const { auth, currentUser, clerkClient } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return;

  const raw = await currentUser();
  if (!raw) return;
  const u = flatten(raw);

  const token = u.unsafeMetadata.invitationToken as string | undefined;
  if (!token) return;

  const sb = createAdminClient();
  const { data: inv } = await sb
    .from("invitations")
    .select("token, company, contact_name, email, used_at")
    .eq("token", token)
    .maybeSingle();
  if (!inv || inv.used_at) return; // unknown or already consumed

  // 1) Promote to pro role
  const clerk = await clerkClient();
  await clerk.users.updateUser(userId, {
    publicMetadata: { ...u.publicMetadata, role: "pro" },
  });

  // 2) Create pros row (idempotent: skip if exists)
  const { data: existingPro } = await sb
    .from("pros")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!existingPro) {
    await sb.from("pros").insert({
      clerk_user_id: userId,
      company: inv.company,
      contact_name: inv.contact_name,
      email: u.primaryEmail ?? inv.email,
      phone: u.primaryPhone,
      payment_terms_days: 30,
      status: "active",
    });
  }

  // 3) Mark invitation as consumed
  await sb.from("invitations").update({ used_at: new Date().toISOString() }).eq("token", token);
}

// ----------------------------------------------------------------------------
// Bulk sync — fired from admin pages so users show up even before they log in
// ----------------------------------------------------------------------------

async function listAllClerkUsers() {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const list = await clerk.users.getUserList({ limit: 200, orderBy: "-created_at" });
  const arr = Array.isArray(list) ? list : (list as any)?.data ?? [];
  return arr as any[];
}

/**
 * Inserts a `customers` row for every Clerk user with role="b2c" missing one.
 * Admin-only operation. Idempotent.
 */
export async function syncCustomersFromClerk() {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const users = (await listAllClerkUsers()).map(flatten);
  const targets = users.filter(
    (u) => (u.publicMetadata.role ?? "b2c") === "b2c",
  );
  if (targets.length === 0) return;

  const ids = targets.map((u) => u.id);
  const { data: existing } = await sb
    .from("customers")
    .select("clerk_user_id")
    .in("clerk_user_id", ids);
  const known = new Set((existing ?? []).map((r: any) => r.clerk_user_id));

  const rows = targets
    .filter((u) => !known.has(u.id))
    .map((u) => ({
      clerk_user_id: u.id,
      name: pickName(u),
      email: u.primaryEmail ?? "",
      phone: u.primaryPhone,
    }));
  if (rows.length > 0) {
    await sb.from("customers").insert(rows);
  }
}

/**
 * Inserts a `pros` row for every Clerk user with role="pro" missing one.
 * Admin-only operation. Idempotent.
 */
export async function syncProsFromClerk() {
  await requireRole(["admin"]);
  const sb = createAdminClient();
  const users = (await listAllClerkUsers()).map(flatten);
  const targets = users.filter((u) => u.publicMetadata.role === "pro");
  if (targets.length === 0) return;

  const ids = targets.map((u) => u.id);
  const { data: existing } = await sb
    .from("pros")
    .select("clerk_user_id")
    .in("clerk_user_id", ids);
  const known = new Set((existing ?? []).map((r: any) => r.clerk_user_id));

  const rows = targets
    .filter((u) => !known.has(u.id))
    .map((u) => ({
      clerk_user_id: u.id,
      company:
        (u.publicMetadata.company as string | undefined) ||
        (u.unsafeMetadata.company as string | undefined) ||
        pickName(u),
      contact_name:
        (u.unsafeMetadata.contactName as string | undefined) || pickName(u),
      email: u.primaryEmail ?? "",
      phone: u.primaryPhone,
      payment_terms_days: 30,
      status: "active" as const,
    }));
  if (rows.length > 0) {
    await sb.from("pros").insert(rows);
  }
}
