"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Minus, ShoppingBag, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Empty } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { ProductCard, ProductThumb } from "@/components/product-card";
import { toast } from "@/components/ui/toaster";
import { money } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types";

const CART_KEY = "nyc_cart_v1";

interface ShopClientProps {
  products: Product[];
  initialCategory: ProductCategory | "all";
}

type Cart = Record<string, number>;

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "cookie", label: "Cookies" },
  { value: "box", label: "Boxes" },
  { value: "icecream", label: "Glaces" },
];

export function ShopClient({ products, initialCategory }: ShopClientProps) {
  const [cat, setCat] = useState<ProductCategory | "all">(initialCategory);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);

  // Hydrate cart from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);
  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const filtered = useMemo(
    () => (cat === "all" ? products : products.filter((p) => p.category === cat)),
    [products, cat],
  );

  const itemsList = useMemo(() => {
    return Object.entries(cart)
      .map(([pid, qty]) => ({ p: products.find((p) => p.id === pid), qty }))
      .filter((x): x is { p: Product; qty: number } => !!x.p && x.qty > 0);
  }, [cart, products]);

  const total = itemsList.reduce((s, it) => s + it.p.price * it.qty, 0);
  const count = Object.values(cart).reduce((s, q) => s + q, 0);

  function addToCart(pid: string) {
    setCart((c) => ({ ...c, [pid]: (c[pid] ?? 0) + 1 }));
    toast({ title: "Ajouté au panier", type: "success" });
  }
  function setQty(pid: string, q: number) {
    setCart((c) => {
      const next = { ...c };
      if (q <= 0) delete next[pid];
      else next[pid] = q;
      return next;
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>La carte</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(1.75rem,3vw,2.25rem)] tracking-[0.04em]">
            La boutique
          </h1>
          <p className="mt-1 text-text-3">Tous nos cookies, boxes et glaces. Cuits du jour à Casablanca.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-4 w-4" /> Panier ({count})
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={c.value === cat ? "secondary" : "ghost"}
            onClick={() => setCat(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty title="Aucun produit dans cette catégorie." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const qty = cart[p.id] ?? 0;
            return (
              <ProductCard
                key={p.id}
                product={p}
                footerSlot={
                  qty > 0 ? (
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="inline-flex items-center overflow-hidden rounded-md border border-border-strong">
                        <button
                          type="button"
                          className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text"
                          onClick={() => setQty(p.id, qty - 1)}
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] bg-surface px-2 py-1.5 text-center text-[0.9rem] tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text"
                          onClick={() => setQty(p.id, qty + 1)}
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Retirer du panier"
                        onClick={() => setQty(p.id, 0)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        addToCart(p.id);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Ajouter au panier
                    </Button>
                  )
                }
              />
            );
          })}
        </div>
      )}

      <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Mon panier">
        {itemsList.length === 0 ? (
          <Empty icon={<ShoppingBag className="h-6 w-6" />}>Votre panier est vide.</Empty>
        ) : (
          <>
            <div>
              {itemsList.map((it) => (
                <div
                  key={it.p.id}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-md">
                    <ProductThumb product={it.p} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{it.p.name}</div>
                    <div className="text-[0.85rem] text-text-3">{money(it.p.price)}</div>
                  </div>
                  <div className="inline-flex items-center overflow-hidden rounded-md border border-border-strong">
                    <button
                      type="button"
                      className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text"
                      onClick={() => setQty(it.p.id, it.qty - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={it.qty}
                      onChange={(e) => setQty(it.p.id, parseInt(e.target.value) || 0)}
                      className="w-11 bg-surface text-center"
                    />
                    <button
                      type="button"
                      className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text"
                      onClick={() => setQty(it.p.id, it.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer"
                    onClick={() => setQty(it.p.id, 0)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="text-text-3">Total</div>
              <div className="font-display text-[1.5rem] text-accent">{money(total)}</div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => setCartOpen(false)}>
                Continuer mes achats
              </Button>
              <a href={`/shop/checkout?items=${encodeURIComponent(JSON.stringify(cart))}`}>
                <Button>
                  <CreditCard className="h-4 w-4" /> Passer commande
                </Button>
              </a>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
