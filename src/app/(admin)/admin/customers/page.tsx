import { PageHeader } from "@/components/ui/misc";
import { listCustomers } from "@/lib/queries";
import { syncCustomersFromClerk } from "@/lib/auth";
import { CustomersClient } from "./customers-client";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  // Backfill any b2c Clerk users that don't yet have a Supabase row.
  await syncCustomersFromClerk().catch(() => undefined);

  const customers = await listCustomers().catch(() => []);
  const count = customers.length;
  const linked = customers.filter((c) => c.clerkUserId).length;

  return (
    <>
      <PageHeader
        title="Clients B2C"
        eyebrow="Clientèle"
        subtitle={
          count === 0
            ? "Aucun client inscrit pour le moment."
            : `${count} client${count > 1 ? "s" : ""} · ${linked} lié${linked > 1 ? "s" : ""} à Clerk.`
        }
      />
      <CustomersClient customers={customers} />
    </>
  );
}
