import { listActiveProducts } from "@/lib/queries";
import { ShopClient } from "./shop-client";
import type { ProductCategory } from "@/lib/types";

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { cat } = await searchParams;
  const initialCat: ProductCategory | "all" =
    cat === "cookie" || cat === "box" || cat === "icecream" ? cat : "all";
  const products = await listActiveProducts().catch(() => []);

  return (
    <div className="container py-10">
      <ShopClient products={products} initialCategory={initialCat} />
    </div>
  );
}
