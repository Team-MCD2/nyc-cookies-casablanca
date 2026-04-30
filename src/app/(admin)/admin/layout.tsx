import { currentUser } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);

  const user = await currentUser();
  return (
    <AppShell
      role="admin"
      brandRole="Admin Console"
      topbarTitle="Console Admin"
      user={{
        name: user?.fullName ?? user?.firstName ?? null,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
