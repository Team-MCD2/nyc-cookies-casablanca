import { Card } from "@/components/ui/card";
import { PageHeader, Empty } from "@/components/ui/misc";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";
import { getProForUser } from "@/lib/auth";
import { listInvoicesForPro, getProById } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";
import { InvoiceActions } from "@/components/invoice-actions";

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
      {invoices.length === 0 ? (
        <Empty title="Aucune facture" />
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Référence</Th>
                  <Th>Émise</Th>
                  <Th>Échéance</Th>
                  <Th className="text-right">Montant</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {invoices.map((i) => (
                  <Tr key={i.id}>
                    <Td className="font-mono text-[0.85rem]">{i.id}</Td>
                    <Td>{formatDate(i.issueDate)}</Td>
                    <Td>{formatDate(i.dueDate)}</Td>
                    <Td className="text-right tabular-nums">{money(i.amount)}</Td>
                    <Td><InvoiceStatusBadge status={i.status} /></Td>
                    <Td className="text-right">
                      <InvoiceActions reference={i.id} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      )}
    </>
  );
}
