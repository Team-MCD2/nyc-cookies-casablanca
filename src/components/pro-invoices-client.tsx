"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { InvoiceActions } from "@/components/invoice-actions";
import { money, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function ProInvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTotalModal, setShowTotalModal] = useState(false);

  const upcomingInvoices = invoices.filter((i) => i.status === "upcoming" || i.status === "overdue");
  const otherInvoices = invoices.filter((i) => i.status !== "upcoming" && i.status !== "overdue");

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === upcomingInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(upcomingInvoices.map((i) => i.id)));
    }
  };

  const totalAmount = Array.from(selectedIds).reduce((sum, id) => {
    const inv = invoices.find((i) => i.id === id);
    return sum + (inv?.amount ?? 0);
  }, 0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Toutes les factures</h2>
        <Button
          disabled={selectedIds.size === 0}
          onClick={() => setShowTotalModal(true)}
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          Calculer le total ({selectedIds.size})
        </Button>
      </div>

      <Card className="p-0">
        <TableWrap className="rounded-none border-0">
          <Table>
            <Thead>
              <Tr>
                <Th className="w-10 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    checked={upcomingInvoices.length > 0 && selectedIds.size === upcomingInvoices.length}
                    onChange={toggleAll}
                    disabled={upcomingInvoices.length === 0}
                  />
                </Th>
                <Th>Référence</Th>
                <Th>Émise</Th>
                <Th>Échéance</Th>
                <Th className="text-right">Montant</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {upcomingInvoices.map((i) => (
                <Tr key={i.id} className="bg-surface-2/30">
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                      checked={selectedIds.has(i.id)}
                      onChange={() => toggleSelection(i.id)}
                    />
                  </Td>
                  <Td className="font-mono text-[0.85rem] font-medium">{i.id}</Td>
                  <Td>{formatDate(i.issueDate)}</Td>
                  <Td>{formatDate(i.dueDate)}</Td>
                  <Td className="text-right tabular-nums font-semibold">{money(i.amount)}</Td>
                  <Td><InvoiceStatusBadge status={i.status} /></Td>
                  <Td className="text-right">
                    <InvoiceActions reference={i.id} />
                  </Td>
                </Tr>
              ))}
              {otherInvoices.map((i) => (
                <Tr key={i.id}>
                  <Td className="text-center">
                    <input type="checkbox" disabled className="h-4 w-4 opacity-30" />
                  </Td>
                  <Td className="font-mono text-[0.85rem] text-text-3">{i.id}</Td>
                  <Td className="text-text-3">{formatDate(i.issueDate)}</Td>
                  <Td className="text-text-3">{formatDate(i.dueDate)}</Td>
                  <Td className="text-right tabular-nums text-text-3">{money(i.amount)}</Td>
                  <Td><InvoiceStatusBadge status={i.status} /></Td>
                  <Td className="text-right opacity-80">
                    <InvoiceActions reference={i.id} />
                  </Td>
                </Tr>
              ))}
              {invoices.length === 0 && (
                <Tr>
                  <Td colSpan={7} className="text-center py-8 text-text-3">Aucune facture trouvée.</Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableWrap>
      </Card>

      <Modal open={showTotalModal} onClose={() => setShowTotalModal(false)} title="Total à payer" size="sm">
        <div className="space-y-4 py-2">
          <p className="text-sm text-text-3">
            Vous avez sélectionné {selectedIds.size} facture{selectedIds.size > 1 ? "s" : ""} impayée{selectedIds.size > 1 ? "s" : ""}.
          </p>
          <div className="bg-surface-2 p-4 rounded-lg flex items-center justify-between border border-border">
            <span className="font-semibold text-text-2">Total :</span>
            <span className="font-mono text-xl font-bold text-accent">{money(totalAmount)}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowTotalModal(false)}>Fermer</Button>
        </div>
      </Modal>
    </>
  );
}
