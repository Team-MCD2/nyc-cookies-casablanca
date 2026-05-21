"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { AdminInvoiceActions } from "@/components/admin-invoice-actions";
import { INVOICE_STATUS_OPTIONS } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { updateInvoiceStatus } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/types";

export function AdminInvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onStatusChange(reference: string, status: InvoiceStatus) {
    start(async () => {
      try {
        await updateInvoiceStatus(reference, status);
        toast({ title: "Facture mise à jour", message: reference, type: "success" });
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
            <Th>Client</Th>
            <Th>Type</Th>
            <Th>Émise</Th>
            <Th>Échéance</Th>
            <Th className="text-right">Montant</Th>
            <Th>Statut</Th>
            <Th>Envoi</Th>
            <Th className="text-center">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {invoices.map((i) => {
            const clientName = i.pro?.company || i.customer?.name || "—";
            const clientType = i.proId ? "Pro 💼" : "—";
            return (
              <Tr key={i.id}>
                <Td className="font-mono text-[0.85rem]">{i.id}</Td>
                <Td className="text-[0.9rem]">{clientName}</Td>
                <Td className="text-[0.8rem] text-text-2">{clientType}</Td>
                <Td>{formatDate(i.issueDate)}</Td>
                <Td>{formatDate(i.dueDate)}</Td>
                <Td className="text-right tabular-nums">{money(i.amount)}</Td>
                <Td>
                  <Select
                    value={i.status}
                    disabled={pending}
                    onChange={(e) => onStatusChange(i.id, e.target.value as InvoiceStatus)}
                    className="h-9 min-w-[9.5rem] text-sm"
                    aria-label={`Statut facture ${i.id}`}
                  >
                    {INVOICE_STATUS_OPTIONS.map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  {i.sentToClient ? (
                    <Badge variant="success" className="text-[0.7rem]">
                      Envoyée
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[0.7rem]">
                      Brouillon
                    </Badge>
                  )}
                </Td>
                <Td className="text-center">
                  <AdminInvoiceActions invoice={i} />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableWrap>
  );
}
