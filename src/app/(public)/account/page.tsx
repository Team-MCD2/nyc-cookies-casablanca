import Link from "next/link";
import {
  Cookie,
  Package,
  ShoppingBag,
  Wallet,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { requireSession, getCustomerForUser } from "@/lib/auth";
import {
  listOrdersForCustomer,
  listActiveProducts,
} from "@/lib/queries";
import { money, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const session = await requireSession();
  const customer = await getCustomerForUser(session.userId);

  // No customer row means the very first render after sign-up beat
  // ensureCustomerRow(). Refreshing solves it; meanwhile we show an empty
  // state instead of crashing.
  if (!customer) {
    return (
      <Empty title="Compte en cours d'initialisation">
        Merci pour ton inscription ! Recharge cette page dans un instant pour
        découvrir ton tableau de bord.
      </Empty>
    );
  }

  const orders = await listOrdersForCustomer(customer.id).catch(() => []);
  const recent = orders.slice(0, 4);
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCookies = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0),
    0,
  );
  const lastOrder = orders[0];
  const inProgress = orders.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status),
  ).length;

  // Simple, server-rendered "you might like" — featured products.
  const products = await listActiveProducts().catch(() => []);
  const suggestions = products.slice(0, 3);

  return (
    <div className="stack-lg">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Commandes"
          value={String(orders.length)}
        />
        <KPI
          icon={<Cookie className="h-4 w-4" />}
          label="Cookies achetés"
          value={String(totalCookies)}
        />
        <KPI
          icon={<Wallet className="h-4 w-4" />}
          label="Total dépensé"
          value={money(totalSpent)}
        />
        <KPI
          icon={<Clock className="h-4 w-4" />}
          label="En cours"
          value={String(inProgress)}
          accent={inProgress > 0}
        />
      </div>

      {/* Last order spotlight */}
      {lastOrder ? (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[0.78rem] uppercase tracking-[0.16em] text-text-3">
              Dernière commande · {formatDate(lastOrder.date)}
            </div>
            <div className="mt-1 font-display text-[1.4rem] tracking-[0.04em]">
              {lastOrder.id}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={lastOrder.status} />
              <PaymentStatusBadge status={lastOrder.payment} />
              <Badge variant="neutral">
                {lastOrder.items.reduce((s, i) => s + i.qty, 0)} article
                {lastOrder.items.length > 1 ? "s" : ""}
              </Badge>
              <span className="text-[0.88rem] text-text-3">
                · {money(lastOrder.total)}
              </span>
            </div>
          </div>
          <Link href={`/account/orders/${lastOrder.id}`}>
            <Button variant="outline">
              Voir le détail <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        <Empty
          icon={<Package className="h-6 w-6" />}
          title="Aucune commande pour l'instant"
        >
          Démarre fort avec ta première commande — un cookie chaud, ça
          n'attend pas.
          <div className="mt-4 flex justify-center">
            <Link href="/shop">
              <Button>
                <ShoppingBag className="h-4 w-4" /> Découvrir le menu
              </Button>
            </Link>
          </div>
        </Empty>
      )}

      {/* Recent orders */}
      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-[1.2rem] tracking-[0.04em]">
              Activité récente
            </h2>
            <Link
              href="/account/orders"
              className="text-[0.85rem] font-medium text-accent hover:underline"
            >
              Tout l'historique →
            </Link>
          </div>
          <div className="stack-sm">
            {recent.map((o) => (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[0.82rem] text-text-3">
                    {o.id}
                  </div>
                  <div className="mt-0.5 text-[0.92rem] font-semibold">
                    {o.items.reduce((s, i) => s + i.qty, 0)} article
                    {o.items.length > 1 ? "s" : ""} · {money(o.total)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <PaymentStatusBadge status={o.payment} />
                  <ArrowRight className="h-4 w-4 text-text-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-[1.2rem] tracking-[0.04em]">
              Tu vas adorer
            </h2>
            <Link
              href="/shop"
              className="text-[0.85rem] font-medium text-accent hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {suggestions.map((p) => (
              <Card key={p.id} className="stack-sm">
                <Badge variant="neutral" className="self-start">
                  {p.category}
                </Badge>
                <div>
                  <div className="font-display text-[1.1rem] tracking-[0.04em]">
                    {p.name}
                  </div>
                  <p className="mt-1 text-[0.85rem] text-text-3 line-clamp-2">
                    {p.desc}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold tabular-nums">
                    {money(p.price)}
                  </span>
                  <Link href="/shop">
                    <Button size="sm" variant="outline">
                      Ajouter
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="stack-sm">
      <div className="flex items-center justify-between">
        <div className="text-[0.72rem] uppercase tracking-[0.16em] text-text-3">
          {label}
        </div>
        <div className={accent ? "text-accent" : "text-text-3"}>{icon}</div>
      </div>
      <div
        className={
          "font-display text-[1.7rem] leading-none tracking-[0.04em] " +
          (accent ? "text-accent" : "")
        }
      >
        {value}
      </div>
    </Card>
  );
}
