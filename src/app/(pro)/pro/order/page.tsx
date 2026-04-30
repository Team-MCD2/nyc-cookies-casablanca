import { PageHeader } from "@/components/ui/misc";
import { listActiveProducts } from "@/lib/queries";
import { ProOrderClient } from "./order-client";

export const dynamic = "force-dynamic";

export default async function ProNewOrderPage() {
  const products = await listActiveProducts().catch(() => []);
  return (
    <>
      <PageHeader
        title="Nouvelle commande"
        eyebrow="Espace pro"
        subtitle="Composez votre commande, validez : la facture est générée à 30 jours."
      />
      <ProOrderClient products={products} />
    </>
  );
}
