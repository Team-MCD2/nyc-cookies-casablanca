import Link from "next/link";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { requireSession, getCustomerForUser } from "@/lib/auth";
import { listOrdersForCustomer } from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await requireSession();
  const customer = await getCustomerForUser(session.userId);

  if (!customer) {
    return (
      <Empty
        icon={<Package className="h-6 w-6" />}
        title="Aucune commande pour l'instant"
      >
        Tu n'as pas encore passé de commande. Le bon moment, c'est maintenant.
        <div className="mt-4 flex justify-center">
          <Link href="/shop">
            <Button>
              <ShoppingBag className="h-4 w-4" /> Découvrir le menu
            </Button>
          </Link>
        </div>
      </Empty>
    );
  }

  const orders = await listOrdersForCustomer(customer.id).catch(() => []);

  if (orders.length === 0) {
    return (
      <Empty
        icon={<Package className="h-6 w-6" />}
        title="Aucune commande pour l'instant"
      >
        Quand tu passeras ta première commande, tu la retrouveras ici avec
        tous les détails (statut, articles, total).
        <div className="mt-4 flex justify-center">
          <Link href="/shop">
            <Button>
              <ShoppingBag className="h-4 w-4" /> Commander maintenant
            </Button>
          </Link>
        </div>
      </Empty>
    );
  }

  // Group by month for a nicer reading flow.
  const groups = new Map<string, typeof orders>();
  for (const o of orders) {
    const key = monthKey(o.date);
    const arr = groups.get(key) ?? [];
    arr.push(o);
    groups.set(key, arr);
  }

  return (
    <div className="stack-lg">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.4rem] tracking-[0.04em]">
            Mes commandes
          </h2>
          <p className="mt-1 text-[0.9rem] text-text-3">
            {orders.length} commande{orders.length > 1 ? "s" : ""} au total —
            cliquez pour voir le détail.
          </p>
        </div>
        <Link href="/shop">
          <Button variant="outline">
            <ShoppingBag className="h-4 w-4" /> Nouvelle commande
          </Button>
        </Link>
      </div>

      {[...groups.entries()].map(([key, list]) => (
        <section key={key} className="stack-sm">
          <div className="text-[0.74rem] uppercase tracking-[0.18em] text-text-3">
            {key}
          </div>
          <div className="stack-sm">
            {list.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="group block"
              >
                <Card className="flex flex-wrap items-center justify-between gap-4 transition-colors group-hover:border-border-strong">
                  <div className="min-w-0">
                    <div className="font-mono text-[0.78rem] text-text-3">
                      {o.id}
                    </div>
                    <div className="mt-0.5 text-[0.95rem] font-semibold">
                      {o.items.reduce((s, i) => s + i.qty, 0)} article
                      {o.items.length > 1 ? "s" : ""}
                    </div>
                    <div className="mt-1 text-[0.85rem] text-text-3">
                      Passée le {formatDate(o.date)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.payment} />
                    <Badge variant="neutral" className="tabular-nums">
                      {money(o.total)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function monthKey(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
