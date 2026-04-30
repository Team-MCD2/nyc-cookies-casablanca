import { Card } from "@/components/ui/card";
import { PageHeader, Empty } from "@/components/ui/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";
import { getProForUser } from "@/lib/auth";
import { listOrdersForPro } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProOrdersPage() {
  const { userId } = await auth();
  const pro = userId ? await getProForUser(userId) : null;
  if (!pro) return <Empty title="Profil pro introuvable." />;

  const orders = await listOrdersForPro(pro.id).catch(() => []);

  return (
    <>
      <PageHeader title="Mes commandes" eyebrow="Historique" subtitle={`${orders.length} commandes.`} />
      {orders.length === 0 ? (
        <Empty title="Aucune commande" />
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Référence</Th>
                  <Th>Date</Th>
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
                    <Td className="text-right tabular-nums">{money(o.total)}</Td>
                    <Td><OrderStatusBadge status={o.status} /></Td>
                    <Td><PaymentStatusBadge status={o.payment} /></Td>
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
