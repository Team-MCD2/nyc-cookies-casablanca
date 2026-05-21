import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { AdminInvoiceActions } from "@/components/admin-invoice-actions";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { listInvoices } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

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
        <TableWrap className="rounded-none border-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Référence</Th>
                <Th>Client</Th>
                <Th>Type</Th>
                <Th>Émise</Th>
                <Th>Échéance</Th>
                <Th className="text-right">Montant</Th>
                <Th>Statut</Th>
                <Th>Envoi</Th>
                <Th className="text-center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.map((i) => {
                const clientName = i.pro?.company || i.customer?.name || "—";
                const clientType = i.proId ? "Pro 💼" : "—";
                return (
                  <Tr key={i.id}>
                    <Td className="font-mono text-[0.85rem]">{i.id}</Td>
                    <Td className="text-[0.9rem]">{clientName}</Td>
                    <Td className="text-[0.8rem] text-text-2">{clientType}</Td>
                    <Td>{formatDate(i.issueDate)}</Td>
                    <Td>{formatDate(i.dueDate)}</Td>
                    <Td className="text-right tabular-nums">{money(i.amount)}</Td>
                    <Td>
                      <InvoiceStatusBadge status={i.status} />
                    </Td>
                    <Td>
                      {i.sentToClient ? (
                        <Badge variant="success" className="text-[0.7rem]">Envoyée</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[0.7rem]">Brouillon</Badge>
                      )}
                    </Td>
                    <Td className="text-center">
                      <AdminInvoiceActions invoice={i} />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableWrap>
      </Card>
    </>
  );
}
