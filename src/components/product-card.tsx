import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, getProductImage } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Product monogram: BOX / ICE for non-cookie categories, first letter otherwise. */
function productMark(p: Product) {
  if (p.category === "box") return { text: "BOX", isText: true };
  if (p.category === "icecream") return { text: "ICE", isText: true };
  return { text: (p.name ?? "?").trim().charAt(0).toUpperCase(), isText: false };
}

import Image from "next/image";

/** Visual square thumbnail with the product monogram or image. */
export function ProductThumb({ product }: { product: Product }) {
  const m = productMark(product);
  const imageUrl = getProductImage(product);
  
  if (imageUrl) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.category === "box" && (
          <span className="absolute left-3 top-3">
            <Badge variant="accent">Box</Badge>
          </span>
        )}
        {product.category === "icecream" && (
          <span className="absolute left-3 top-3">
            <Badge variant="info">Glace</Badge>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_30%,#2a1a10,#0a0a0a_70%)]">
      <div
        className="relative font-display leading-none text-cream"
        style={{
          fontSize: m.isText ? "clamp(1.6rem, 3.4vw, 2.2rem)" : "clamp(3rem, 6vw, 4.4rem)",
          letterSpacing: m.isText ? "0.18em" : "0.04em",
          textShadow: "0 6px 14px rgba(0,0,0,0.55)",
        }}
      >
        {m.text}
        <span
          aria-hidden
          className="absolute left-1/2 top-full mt-3 h-0.5 w-9 -translate-x-1/2 bg-accent"
        />
      </div>
      {product.category === "box" && (
        <span className="absolute left-3 top-3">
          <Badge variant="accent">Box</Badge>
        </span>
      )}
      {product.category === "icecream" && (
        <span className="absolute left-3 top-3">
          <Badge variant="info">Glace</Badge>
        </span>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  ctaHref?: string;
  ctaLabel?: string;
  /** Renders an extra footer slot (e.g. "Add to cart" client button). */
  footerSlot?: React.ReactNode;
}

/** Public product card with thumbnail, name, desc, price, CTA. */
export function ProductCard({ product, ctaHref = "/devenir-pro", ctaLabel = "Commander en pro", footerSlot }: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[transform,border-color,box-shadow] duration-base hover:-translate-y-1 hover:border-accent hover:shadow-elev-lg">
      <ProductThumb product={product} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="font-display text-[1.2rem] tracking-[0.04em]">{product.name}</div>
        <div className="min-h-[2.6em] text-[0.88rem] text-text-3">{product.desc}</div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="font-display text-[1.3rem] text-accent">{money(product.price)}</div>
          {footerSlot ?? (
            <Link href={ctaHref}>
              <Button variant="secondary" size="sm">
                {ctaLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
