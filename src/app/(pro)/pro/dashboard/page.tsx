import Link from "next/link";
import { Plus } from "lucide-react";
import { Kpi } from "@/components/ui/kpi";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader } from "@/components/ui/misc";
import { OrderStatusBadge, InvoiceStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";
import { getProForUser } from "@/lib/auth";
import { listOrdersForPro, listInvoicesForPro } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProDashboardPage() {
  const { userId } = await auth();
  const pro = userId ? await getProForUser(userId) : null;

  if (!pro) {
    return (
      <Empty title="Profil pro non lié">
        Votre compte Clerk n'est pas encore associé à un profil pro. Contactez l'admin pour finaliser
        votre activation.
      </Empty>
    );
  }

  const [orders, invoices] = await Promise.all([
    listOrdersForPro(pro.id),
    listInvoicesForPro(pro.id),
  ]);

  const upcoming = invoices.filter((i) => i.status === "upcoming");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const paid = invoices.filter((i) => i.status === "paid");
  const upcomingTotal = upcoming.reduce((s, i) => s + i.amount, 0);
  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title={`Bienvenue, ${pro.company}`}
        eyebrow="Mon espace"
        actions={
          <Link href="/pro/order">
            <Button>
              <Plus className="h-4 w-4" /> Nouvelle commande
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="À venir" value={money(upcomingTotal)} delta={`${upcoming.length} factures`} />
        <Kpi label="En retard" value={money(overdueTotal)} delta={`${overdue.length} factures`} deltaTone={overdue.length > 0 ? "down" : undefined} />
        <Kpi label="Payées" value={String(paid.length)} />
        <Kpi label="Délai paiement" value={`${pro.paymentTerms}j`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mes dernières commandes</CardTitle>
          </CardHeader>
          {orders.length === 0 ? (
            <Empty title="Aucune commande">Passez votre première commande pour démarrer.</Empty>
          ) : (
            <TableWrap>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Référence</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Total</Th>
                    <Th>Statut</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.slice(0, 6).map((o) => (
                    <Tr key={o.id}>
                      <Td className="font-mono text-[0.85rem]">{o.id}</Td>
                      <Td>{formatDate(o.date)}</Td>
                      <Td className="text-right tabular-nums">{money(o.total)}</Td>
                      <Td>
                        <OrderStatusBadge status={o.status} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes factures</CardTitle>
          </CardHeader>
          {invoices.length === 0 ? (
            <Empty title="Aucune facture pour le moment." />
          ) : (
            <TableWrap>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Référence</Th>
                    <Th>Échéance</Th>
                    <Th className="text-right">Montant</Th>
                    <Th>Statut</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.slice(0, 6).map((i) => (
                    <Tr key={i.id}>
                      <Td className="font-mono text-[0.85rem]">{i.id}</Td>
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
          )}
        </Card>
      </div>
    </>
  );
}
