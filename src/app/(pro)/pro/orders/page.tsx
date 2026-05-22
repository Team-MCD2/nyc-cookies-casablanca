import { Card } from "@/components/ui/card";
import { PageHeader, Empty } from "@/components/ui/misc";
import { auth } from "@clerk/nextjs/server";
import { getProForUser } from "@/lib/auth";
import { listOrdersForPro, listProducts } from "@/lib/queries";
import { ProOrdersClient } from "@/components/pro-orders-client";

export const dynamic = "force-dynamic";

export default async function ProOrdersPage() {
  const { userId } = await auth();
  const pro = userId ? await getProForUser(userId) : null;
  if (!pro) return <Empty title="Profil pro introuvable." />;

  const orders = await listOrdersForPro(pro.id).catch(() => []);
  const products = await listProducts().catch(() => []);

  return (
    <>
      <PageHeader title="Mes commandes" eyebrow="Historique" subtitle={`${orders.length} commandes.`} />
      {orders.length === 0 ? (
        <Empty title="Aucune commande" />
      ) : (
        <Card className="p-0">
          <ProOrdersClient orders={orders} products={products} />
        </Card>
      )}
    </>
  );
}
