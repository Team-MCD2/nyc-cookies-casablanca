import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { AdminInvoicesClient } from "@/components/admin-invoices-client";
import { listInvoices } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const invoices = await listInvoices().catch(() => []);

  return (
    <>
      <PageHeader
        title="Factures"
        eyebrow="Facturation"
        subtitle={`${invoices.length} factures émises.`}
      />

      <Card className="p-0">
        <AdminInvoicesClient invoices={invoices} />
      </Card>
    </>
  );
}
