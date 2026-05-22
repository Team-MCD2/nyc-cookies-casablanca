"use client";

import { useState } from "react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { money, formatDate } from "@/lib/utils";
import type { Order, Product } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export function ProOrdersClient({ orders, products }: { orders: Order[], products: Product[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  return (
    <>
      <TableWrap className="rounded-none border-0">
        <Table>
          <Thead>
            <Tr>
              <Th>Référence</Th>
              <Th>Date</Th>
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
                <Td className="text-right tabular-nums">{money(o.total)}</Td>
                <Td><OrderStatusBadge status={o.status} /></Td>
                <Td><PaymentStatusBadge status={o.payment} /></Td>
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
