import { Kpi } from "@/components/ui/kpi";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { OrderStatusBadge, InvoiceStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { listOrders, listInvoices, listProducts, listPros } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orders, invoices, products, pros] = await Promise.all([
    listOrders().catch(() => []),
    listInvoices().catch(() => []),
    listProducts().catch(() => []),
    listPros().catch(() => []),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").length;
  const toPrep = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const lowStock = products.filter((p) => p.stock < 20 && p.active).length;

  const recentOrders = orders.slice(0, 6);
  const upcomingInvoices = invoices.filter((i) => i.status !== "paid").slice(0, 6);

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Pilotage" />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Chiffre d'affaires" value={money(revenue)} />
        <Kpi label="Encours pros" value={money(outstanding)} delta={`${overdue} en retard`} deltaTone={overdue > 0 ? "down" : undefined} />
        <Kpi label="À préparer" value={String(toPrep)} />
        <Kpi label="Stock faible" value={String(lowStock)} delta={lowStock > 0 ? "Alerte" : "OK"} deltaTone={lowStock > 0 ? "down" : "up"} />
      </div>

      {/* Recent orders */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dernières commandes</CardTitle>
            <Badge variant="neutral">{orders.length} total</Badge>
          </CardHeader>
          <TableWrap>
            <Table>
              <Thead>
                <Tr>
                  <Th>Référence</Th>
                  <Th>Type</Th>
                  <Th>Total</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentOrders.map((o) => (
                  <Tr key={o.id}>
                    <Td className="font-mono text-[0.85rem]">{o.id}</Td>
                    <Td>
                      <Badge variant={o.customerType === "pro" ? "accent" : "info"}>
                        {o.customerType.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>{money(o.total)}</Td>
                    <Td>
                      <OrderStatusBadge status={o.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factures à venir</CardTitle>
            <Badge variant="neutral">{pros.length} pros</Badge>
          </CardHeader>
          <TableWrap>
            <Table>
              <Thead>
                <Tr>
                  <Th>Référence</Th>
                  <Th>Échéance</Th>
                  <Th>Montant</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {upcomingInvoices.map((i) => (
                  <Tr key={i.id}>
                    <Td className="font-mono text-[0.85rem]">{i.id}</Td>
                    <Td>{formatDate(i.dueDate)}</Td>
                    <Td>{money(i.amount)}</Td>
                    <Td>
                      <InvoiceStatusBadge status={i.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
