import { currentUser } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { ensureProRow, requireRole } from "@/lib/auth";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["pro"]);
  // Defensive: ensure the Supabase pros row exists for this Clerk user
  // (covers the case where the user was created directly in the Clerk dashboard).
  await ensureProRow().catch(() => undefined);

  const user = await currentUser();
  return (
    <AppShell
      role="pro"
      brandRole="Pro Portal"
      topbarTitle="Espace Pro"
      user={{
        name: user?.fullName ?? user?.firstName ?? null,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
