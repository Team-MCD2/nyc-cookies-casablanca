import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus, InvoiceStatus, ProStatus } from "@/lib/types";

const ORDER_MAP: Record<OrderStatus, { variant: "warning" | "info" | "accent" | "success" | "danger"; label: string }> = {
  pending: { variant: "warning", label: "En attente" },
  preparing: { variant: "info", label: "En préparation" },
  ready: { variant: "accent", label: "Prête" },
  delivered: { variant: "success", label: "Livrée" },
  cancelled: { variant: "danger", label: "Annulée" },
};

const PAYMENT_MAP: Record<PaymentStatus, { variant: "warning" | "success"; label: string }> = {
  pending: { variant: "warning", label: "En attente" },
  paid: { variant: "success", label: "Payée" },
};

const INVOICE_MAP: Record<InvoiceStatus, { variant: "warning" | "success" | "danger"; label: string }> = {
  upcoming: { variant: "warning", label: "À payer" },
  paid: { variant: "success", label: "Payée" },
  overdue: { variant: "danger", label: "En retard" },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_MAP) as [OrderStatus, (typeof ORDER_MAP)[OrderStatus]][];
export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_MAP) as [PaymentStatus, (typeof PAYMENT_MAP)[PaymentStatus]][];
export const INVOICE_STATUS_OPTIONS = Object.entries(INVOICE_MAP) as [InvoiceStatus, (typeof INVOICE_MAP)[InvoiceStatus]][];

const PRO_MAP: Record<ProStatus, { variant: "success" | "neutral"; label: string }> = {
  active: { variant: "success", label: "Actif" },
  inactive: { variant: "neutral", label: "Inactif" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const m = PAYMENT_MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const m = INVOICE_MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function ProStatusBadge({ status }: { status: ProStatus }) {
  const m = PRO_MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
