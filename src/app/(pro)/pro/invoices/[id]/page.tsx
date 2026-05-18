import { notFound } from "next/navigation";
import { getInvoiceByReference, listProducts } from "@/lib/queries";
import { InvoiceDetailClient } from "./invoice-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = await getInvoiceByReference(id);

  if (!invoice) notFound();

  const products = await listProducts().catch(() => []);
  const productById = new Map(products.map((p) => [p.id, p]));

  const lineItems = invoice.order
    ? invoice.order.items.map((it) => {
        const p = productById.get(it.pid);
        const unit = p?.price ?? 0;
        return {
          pid: it.pid,
          name: p?.name ?? it.pid,
          desc: p?.desc ?? "",
          category: p?.category ?? "—",
          qty: it.qty,
          unit,
          subtotal: unit * it.qty,
        };
      })
    : [];

  return (
    <InvoiceDetailClient
      invoice={{
        id: invoice.id,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        status: invoice.status,
      }}
      pro={{
        company: invoice.pro?.company ?? "Entreprise Cliente",
        contactName: invoice.pro?.contactName ?? "Responsable",
        email: invoice.pro?.email ?? "",
        phone: invoice.pro?.phone,
        address: invoice.pro?.address,
        ice: invoice.pro?.ice,
      }}
      lineItems={lineItems}
    />
  );
}
