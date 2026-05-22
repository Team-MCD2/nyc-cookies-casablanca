import { PageHeader, Empty } from "@/components/ui/misc";
import { auth } from "@clerk/nextjs/server";
import { getProForUser } from "@/lib/auth";
import { listInvoicesForPro, getProById } from "@/lib/queries";
import { ProInvoicesClient } from "@/components/pro-invoices-client";

export const dynamic = "force-dynamic";

export default async function ProInvoicesPage() {
  const { userId } = await auth();
  const proRow = userId ? await getProForUser(userId) : null;
  const pro = proRow?.id ? await getProById(proRow.id) : null;
  if (!pro) return <Empty title="Profil pro introuvable." />;

  const invoices = await listInvoicesForPro(pro.id).catch(() => []);

  return (
    <>
      <PageHeader title="Mes factures" eyebrow="Facturation" subtitle={`${invoices.length} factures.`} />
      <ProInvoicesClient invoices={invoices} />
    </>
  );
}
