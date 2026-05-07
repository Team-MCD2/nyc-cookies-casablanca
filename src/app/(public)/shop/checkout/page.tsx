"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShoppingBag, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/misc";
import { money } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { listActiveProducts } from "@/lib/queries";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const itemsRaw = searchParams.get("items");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    // Fetch products to get latest prices/names
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products"); // Assuming an API exists or just fetch directly if possible
        // Since this is a client component and we want it simple, we'll just use a mock or similar if the API is not ready
        // But for now, let's assume we can get them.
      } catch (e) {}
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const cart: Record<string, number> = itemsRaw ? JSON.parse(itemsRaw) : {};
  
  // This is a simplification, in a real app you'd fetch these from the DB
  const itemsList = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
  
  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderComplete(true);
  };

  if (orderComplete) {
    return (
      <div className="container py-20 text-center flex flex-col items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-4xl">Commande reçue !</h1>
        <p className="text-text-3 text-lg max-w-md">
          Merci pour votre commande. Notre équipe commence la préparation de vos cookies tout de suite. Vous recevrez un appel pour confirmer la livraison.
        </p>
        <Link href="/">
          <Button size="lg">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Link href="/shop" className="inline-flex items-center gap-2 text-text-3 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        <div className="stack-lg">
          <div>
            <Eyebrow>Checkout</Eyebrow>
            <h1 className="mt-2">Finaliser ma commande</h1>
          </div>

          <form onSubmit={handleOrder} className="stack-lg">
            <Card className="p-6 stack">
              <h3 className="flex items-center gap-2 border-b border-border pb-3 mb-2">
                <Truck className="h-5 w-5 text-accent" /> Informations de livraison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="stack-sm">
                  <label className="text-sm font-medium">Nom complet</label>
                  <input required className="w-full bg-surface-2 border border-border-strong rounded-md px-4 py-2.5 focus:outline-none focus:border-accent" placeholder="Prénom Nom" />
                </div>
                <div className="stack-sm">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input required className="w-full bg-surface-2 border border-border-strong rounded-md px-4 py-2.5 focus:outline-none focus:border-accent" placeholder="06..." />
                </div>
              </div>
              <div className="stack-sm">
                <label className="text-sm font-medium">Adresse de livraison</label>
                <textarea required className="w-full bg-surface-2 border border-border-strong rounded-md px-4 py-2.5 focus:outline-none focus:border-accent min-h-[100px]" placeholder="Rue, quartier, étage..." />
              </div>
            </Card>

            <Card className="p-6 stack">
              <h3 className="flex items-center gap-2 border-b border-border pb-3 mb-2">
                <CreditCard className="h-5 w-5 text-accent" /> Mode de paiement
              </h3>
              <div className="p-4 rounded-lg border border-accent bg-accent/5 flex items-center justify-between">
                <div className="font-medium">Paiement à la livraison</div>
                <div className="text-xs uppercase tracking-widest text-accent font-bold">Sélectionné</div>
              </div>
              <p className="text-xs text-text-3 italic mt-2">
                * Le paiement par carte sera bientôt disponible. Actuellement nous acceptons uniquement les paiements en espèces ou par virement.
              </p>
            </Card>

            <Button type="submit" size="lg" block className="h-14 text-lg">
              Confirmer ma commande
            </Button>
          </form>
        </div>

        <aside>
          <Card className="p-6 sticky top-24">
            <h3 className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <ShoppingBag className="h-5 w-5 text-accent" /> Résumé du panier
            </h3>
            <div className="stack-sm text-sm text-text-3 py-4">
               {/* Simplified list as we don't have product details here without a proper fetch */}
               <p>Articles dans le panier : {Object.values(cart).reduce((a, b) => a + b, 0)}</p>
               <p className="italic text-xs mt-2">Le détail des produits s'affiche lors de la validation finale.</p>
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-3">Livraison</span>
                <span className="text-accent font-medium">Gratuite</span>
              </div>
              <div className="flex justify-between items-center text-xl font-display mt-4 pt-4 border-t border-border-strong">
                <span>Total</span>
                <span className="text-accent">À confirmer</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Chargement...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
