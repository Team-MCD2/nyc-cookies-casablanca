"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { updateOrderStatus, updateOrderPayment } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus, Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export function AdminOrdersClient({ orders, products }: { orders: Order[], products: Product[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  function onStatusChange(reference: string, status: OrderStatus) {
    start(async () => {
      try {
        await updateOrderStatus(reference, status);
        toast({ title: "Statut mis à jour", message: reference, type: "success" });
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de la mise à jour.",
          type: "danger",
        });
      }
    });
  }

  function onPaymentChange(reference: string, payment: PaymentStatus) {
    start(async () => {
      try {
        await updateOrderPayment(reference, payment);
        toast({ title: "Paiement mis à jour", message: reference, type: "success" });
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de la mise à jour.",
          type: "danger",
        });
      }
    });
  }

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  return (
    <>
      <TableWrap className="rounded-none border-0">
        <Table>
          <Thead>
            <Tr>
              <Th>Référence</Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th className="text-right">Total</Th>
              <Th>Statut</Th>
              <Th>Paiement</Th>
            </Tr>
          </Thead>
          <Tbody>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="font-mono text-[0.85rem] text-accent hover:underline flex items-center gap-1.5"
                  >
                    <Package className="h-3 w-3" />
                    {o.id}
                  </button>
                </Td>
                <Td>{formatDate(o.date)}</Td>
                <Td>
                  {o.customerType === "pro" ? (
                    <Badge variant="accent">PRO</Badge>
                  ) : (
                    <span className="text-text-3 text-xs">B2C</span>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{money(o.total)}</Td>
                <Td>
                  <Select
                    value={o.status}
                    disabled={pending}
                    onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
                    className="h-9 min-w-[10.5rem] text-sm"
                    aria-label={`Statut ${o.id}`}
                  >
                    {ORDER_STATUS_OPTIONS.map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Select
                    value={o.payment}
                    disabled={pending}
                    onChange={(e) => onPaymentChange(o.id, e.target.value as PaymentStatus)}
                    className="h-9 min-w-[9rem] text-sm"
                    aria-label={`Paiement ${o.id}`}
                  >
                    {PAYMENT_STATUS_OPTIONS.map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableWrap>

      {selectedOrder && (
        <Modal open={true} onClose={() => setSelectedOrder(null)} title={`Détails commande ${selectedOrder.id}`}>
          <div className="space-y-4 py-2">
            <div className="text-sm space-y-1">
              <p><span className="text-text-3">Date :</span> {formatDate(selectedOrder.date)}</p>
              <p><span className="text-text-3">Total :</span> {money(selectedOrder.total)}</p>
              <p><span className="text-text-3">Type :</span> {selectedOrder.customerType.toUpperCase()}</p>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-text-2">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium">Produit</th>
                    <th className="py-2 px-3 text-center font-medium">Qté</th>
                    <th className="py-2 px-3 text-right font-medium">Prix U.</th>
                    <th className="py-2 px-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedOrder.items.map((item, idx) => {
                    const product = productMap[item.pid];
                    const name = product?.name || item.pid;
                    const price = product?.price || 0;
                    const total = price * item.qty;
                    return (
                      <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                        <td className="py-2 px-3">{name}</td>
                        <td className="py-2 px-3 text-center">{item.qty}</td>
                        <td className="py-2 px-3 text-right text-text-3 tabular-nums">{money(price)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{money(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setSelectedOrder(null)}>Fermer</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
