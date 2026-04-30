import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { listInvoices, listPros } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const [invoices, pros] = await Promise.all([
    listInvoices().catch(() => []),
    listPros().catch(() => []),
  ]);
  const proMap = new Map(pros.map((p) => [p.id, p]));

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
                <Th>Pro</Th>
                <Th>Émise</Th>
                <Th>Échéance</Th>
                <Th className="text-right">Montant</Th>
                <Th>Statut</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.map((i) => (
                <Tr key={i.id}>
                  <Td className="font-mono text-[0.85rem]">{i.id}</Td>
                  <Td className="text-[0.9rem]">{proMap.get(i.proId)?.company ?? "—"}</Td>
                  <Td>{formatDate(i.issueDate)}</Td>
                  <Td>{formatDate(i.dueDate)}</Td>
                  <Td className="text-right tabular-nums">{money(i.amount)}</Td>
                  <Td>
                    <InvoiceStatusBadge status={i.status} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableWrap>
      </Card>
    </>
  );
}
