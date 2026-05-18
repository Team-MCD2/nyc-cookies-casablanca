import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cookie, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TableWrap,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { requireSession, getCustomerForUser } from "@/lib/auth";
import { getOrderForCustomer, listProducts } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";
import { OrderActions } from "@/components/order-actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_TIMELINE = [
  { key: "pending", label: "Validée" },
  { key: "preparing", label: "En préparation" },
  { key: "ready", label: "Prête" },
  { key: "delivered", label: "Livrée" },
] as const;

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const customer = await getCustomerForUser(session.userId);
  if (!customer) notFound();

  const order = await getOrderForCustomer(customer.id, id);
  if (!order) notFound();

  // Resolve product names + prices for the items
  const products = await listProducts().catch(() => []);
  const productById = new Map(products.map((p) => [p.id, p]));

  const lineItems = order.items.map((it) => {
    const p = productById.get(it.pid);
    const unit = p?.price ?? 0;
    return {
      pid: it.pid,
      name: p?.name ?? it.pid,
      desc: p?.desc ?? "",
      category: p?.category ?? "—",
      qty: it.qty,
      unit,
      subtotal: unit * it.qty,
    };
  });

  const itemsTotal = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const totalQty = lineItems.reduce((s, l) => s + l.qty, 0);
  const cancelled = order.status === "cancelled";
  const currentStep = cancelled
    ? -1
    : STATUS_TIMELINE.findIndex((s) => s.key === order.status);

  return (
    <div className="stack-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-[0.9rem] text-text-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux commandes
        </Link>
        <div className="flex items-center gap-2">
          <OrderActions reference={order.id} customerEmail={customer.email} />
          <Link href="/shop">
            <Button variant="outline" size="sm">
              Recommander
            </Button>
          </Link>
        </div>
      </div>

      {/* Order summary header */}
      <Card className="stack-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[0.78rem] uppercase tracking-[0.18em] text-text-3">
              Commande
            </div>
            <div className="mt-1 font-display text-[1.6rem] tracking-[0.04em]">
              {order.id}
            </div>
            <div className="mt-1 text-[0.88rem] text-text-3">
              Passée le {formatDate(order.date)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment} />
            <Badge variant="neutral" className="tabular-nums">
              {money(order.total)}
            </Badge>
          </div>
        </div>

        {/* Status timeline */}
        {!cancelled && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {STATUS_TIMELINE.map((step, idx) => {
              const reached = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div
                  key={step.key}
                  className={
                    "rounded-md border px-3 py-2 text-center text-[0.78rem] font-medium uppercase tracking-[0.08em] " +
                    (active
                      ? "border-accent bg-accent-soft text-accent"
                      : reached
                        ? "border-border-strong bg-surface-2 text-text"
                        : "border-dashed border-border bg-surface text-text-muted")
                  }
                >
                  {step.label}
                </div>
              );
            })}
          </div>
        )}
        {cancelled && (
          <div className="mt-2 rounded-md border border-danger/40 bg-danger-soft px-4 py-3 text-[0.88rem] text-danger">
            Cette commande a été annulée. Si tu pensais avoir été débité par
            erreur, contacte-nous.
          </div>
        )}
      </Card>

      {/* Line items */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-accent" />
            <h2 className="font-display text-[1.1rem] tracking-[0.04em]">
              Articles
            </h2>
          </div>
          <div className="text-[0.85rem] text-text-3">
            {totalQty} article{totalQty > 1 ? "s" : ""}
          </div>
        </div>
        <TableWrap className="rounded-none border-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Produit</Th>
                <Th>Catégorie</Th>
                <Th className="text-right">Qté</Th>
                <Th className="text-right">P.U.</Th>
                <Th className="text-right">Sous-total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {lineItems.map((li) => (
                <Tr key={li.pid}>
                  <Td>
                    <div className="font-semibold">{li.name}</div>
                    <div className="text-[0.82rem] text-text-3 line-clamp-1">
                      {li.desc}
                    </div>
                  </Td>
                  <Td>
                    <Badge variant="neutral">{li.category}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{li.qty}</Td>
                  <Td className="text-right tabular-nums">
                    {money(li.unit)}
                  </Td>
                  <Td className="text-right tabular-nums font-semibold">
                    {money(li.subtotal)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableWrap>

        {/* Totals */}
        <div className="border-t border-border px-5 py-4">
          <div className="ml-auto max-w-xs space-y-1.5 text-[0.92rem]">
            <Row label="Sous-total" value={money(itemsTotal)} />
            {itemsTotal !== order.total && (
              <Row
                label="Ajustements"
                value={money(order.total - itemsTotal)}
                muted
              />
            )}
            <div className="flex justify-between border-t border-border pt-2 font-display tracking-[0.04em]">
              <span>Total</span>
              <span className="tabular-nums">{money(order.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Help line */}
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-5 py-4 text-[0.88rem] text-text-3">
        <div className="flex items-center gap-2 text-text">
          <Package className="h-4 w-4 text-accent" />
          <span className="font-semibold">Une question sur cette commande ?</span>
        </div>
        <p className="mt-1">
          Écris-nous à{" "}
          <a
            href="mailto:hello@nyccookies.ma"
            className="text-accent hover:underline"
          >
            hello@nyccookies.ma
          </a>{" "}
          en mentionnant la référence <code className="font-mono">{order.id}</code>.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={
        "flex justify-between " + (muted ? "text-text-3" : "text-text-2")
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
