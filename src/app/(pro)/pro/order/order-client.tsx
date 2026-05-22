"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { CartQuantityControl } from "@/components/cart-quantity-control";
import { CookieLoadingOverlay } from "@/components/cookie-loading-overlay";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { ProductCard } from "@/components/product-card";
import { toast } from "@/components/ui/toaster";
import { money } from "@/lib/utils";
import { placeOrder } from "@/lib/actions";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export function ProOrderClient({ products }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [validating, setValidating] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();

  const items = Object.entries(cart)
    .map(([pid, qty]) => ({ p: products.find((x) => x.id === pid), qty }))
    .filter((x): x is { p: Product; qty: number } => !!x.p && x.qty > 0);
  const total = items.reduce((s, it) => s + it.p.price * it.qty, 0);

  function add(pid: string) {
    setCart((c) => ({ ...c, [pid]: (c[pid] ?? 0) + 1 }));
  }
  function setQty(pid: string, q: number) {
    setCart((c) => {
      const next = { ...c };
      if (q <= 0) delete next[pid];
      else next[pid] = q;
      return next;
    });
  }

  function submit() {
    if (items.length === 0) {
      toast({ title: "Panier vide", type: "warning" });
      return;
    }
    setValidating(true);
    start(async () => {
      try {
        const payload = items.map((it) => ({ pid: it.p.id, qty: it.qty }));
        const { reference, total } = await placeOrder({ items: payload });
        toast({
          title: "Commande validée",
          message: `${reference} — ${money(total)} · facture à 30 jours générée.`,
          type: "success",
          timeout: 5000,
        });
        setCart({});
        router.push("/pro/orders");
      } catch (e) {
        setValidating(false);
        toast({
          title: "Erreur",
          message: e instanceof Error ? e.message : "Échec de la commande.",
          type: "danger",
        });
      }
    });
  }

  return (
    <>
      <CookieLoadingOverlay
        visible={validating}
        message="Validation de votre commande…"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            footerSlot={
              <Button size="sm" onClick={() => add(p.id)}>
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            }
          />
        ))}
      </div>

      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Mon panier</CardTitle>
            <span className="text-[0.85rem] text-text-3">{items.length} article(s)</span>
          </CardHeader>
          {items.length === 0 ? (
            <Empty title="Vide pour l'instant.">Ajoutez des produits pour commencer.</Empty>
          ) : (
            <>
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.p.id} className="flex items-center gap-3 py-2">
                    <div className="flex-1">
                      <div className="font-semibold">{it.p.name}</div>
                      <div className="text-[0.85rem] text-text-3">{money(it.p.price)}</div>
                    </div>
                    <CartQuantityControl
                      value={it.qty}
                      onChange={(q) => setQty(it.p.id, q)}
                      max={it.p.stock > 0 ? it.p.stock : undefined}
                    />
                    <button
                      type="button"
                      className="text-text-3 hover:text-danger"
                      onClick={() => setQty(it.p.id, 0)}
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-text-3">Total</span>
                <span className="font-display text-[1.5rem] text-accent">{money(total)}</span>
              </div>
              <Button block onClick={submit} disabled={validating} className="mt-4">
                <CreditCard className="h-4 w-4" />
                {validating ? "Validation…" : "Passer commande (30j)"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}
