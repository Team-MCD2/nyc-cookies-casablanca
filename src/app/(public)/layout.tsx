import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { currentUser } from "@clerk/nextjs/server";
import {
  consumePendingInvitation,
  ensureCustomerRow,
  ensureProRow,
  getCurrentSession,
  roleHome,
} from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // 1. Finish any pending pro-invite onboarding (promotes role + creates pros row).
  // 2. Then a second session read picks up the new role.
  await consumePendingInvitation().catch(() => undefined);

  const session = await getCurrentSession();
  // Side-effects: lazily provision the matching Supabase row so the user
  // shows up immediately in the admin tables.
  if (session?.role === "b2c") {
    await ensureCustomerRow().catch(() => undefined);
  } else if (session?.role === "pro") {
    await ensureProRow().catch(() => undefined);
  }
  const role = session?.role ?? "b2c";

  const spaceHref = session ? roleHome(role) : "/login";
  const spaceLabel =
    role === "admin" ? "Console Admin" : role === "pro" ? "Espace Pro" : "Mon compte";

  const clerkUser = session ? await currentUser() : null;
  const user = clerkUser
    ? {
        name: clerkUser.fullName ?? clerkUser.firstName ?? null,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        role,
      }
    : null;

  return (
    <>
      <PublicHeader user={user} spaceHref={spaceHref} spaceLabel={spaceLabel} />
      <main id="main">{children}</main>
      <PublicFooter />
    </>
  );
}
