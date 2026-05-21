"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { updateOrderStatus, updateOrderPayment } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const ORDER_STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "delivered", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid"];

export function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

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

  return (
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
              <Td className="font-mono text-[0.85rem]">{o.id}</Td>
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
                <div className="flex flex-col gap-1.5">
                  <OrderStatusBadge status={o.status} />
                  <Select
                    value={o.status}
                    disabled={pending}
                    onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
                    className="h-8 text-xs"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </Td>
              <Td>
                <div className="flex flex-col gap-1.5">
                  <PaymentStatusBadge status={o.payment} />
                  <Select
                    value={o.payment}
                    disabled={pending}
                    onChange={(e) => onPaymentChange(o.id, e.target.value as PaymentStatus)}
                    className="h-8 text-xs"
                  >
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableWrap>
  );
}
