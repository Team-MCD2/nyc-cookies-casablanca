import { PageHeader } from "@/components/ui/misc";
import { listProducts } from "@/lib/queries";
import { ProductsClient } from "./products-client";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProducts().catch(() => []);
  const count = products.length;

  return (
    <>
      <PageHeader
        title="Produits"
        eyebrow="Catalogue"
        subtitle={`${count} produit${count > 1 ? "s" : ""} référencé${count > 1 ? "s" : ""}.`}
      />
      <ProductsClient products={products} />
    </>
  );
}
