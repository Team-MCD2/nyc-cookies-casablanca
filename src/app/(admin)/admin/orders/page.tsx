import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { AdminOrdersClient } from "@/components/admin-orders-client";
import { listOrders, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listOrders().catch(() => []);
  const products = await listProducts().catch(() => []);

  return (
    <>
      <PageHeader
        title="Commandes"
        eyebrow="Opérations"
        subtitle={`${orders.length} commandes.`}
      />

      <Card className="p-0">
        <AdminOrdersClient orders={orders} products={products} />
      </Card>
    </>
  );
}
