import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { listOrders } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders().catch(() => []);

  return (
    <>
      <PageHeader
        title="Commandes"
        eyebrow="Opérations"
        subtitle={`${orders.length} commandes.`}
      />

      <Card className="p-0">
        <TableWrap className="rounded-none border-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Référence</Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th className="text-right">Total</Th>
                <Th>Statut</Th>
                <Th>Paiement</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-mono text-[0.85rem]">{o.id}</Td>
                  <Td>{formatDate(o.date)}</Td>
                  <Td>
                    {o.customerType === "pro" ? (
                      <Badge variant="accent">PRO</Badge>
                    ) : (
                      <span className="text-text-3 text-xs">—</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{money(o.total)}</Td>
                  <Td>
                    <OrderStatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <PaymentStatusBadge status={o.payment} />
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
