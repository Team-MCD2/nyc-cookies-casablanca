"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Send, Percent, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Label, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import {
  applyInvoiceTva,
  deleteInvoice,
  sendInvoiceToClient,
} from "@/lib/actions";
import type { Invoice } from "@/lib/types";

export function AdminInvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tvaOpen, setTvaOpen] = useState(false);
  const [tvaRate, setTvaRate] = useState(String(invoice.tvaRate ?? 20));
  const [deleteOpen, setDeleteOpen] = useState(false);

  function onSend() {
    start(async () => {
      try {
        const res = await sendInvoiceToClient(invoice.id);
        toast({
          title: res.whatsappSent ? "Facture envoyée" : "Facture publiée",
          message: res.message,
          type: res.whatsappSent ? "success" : "warning",
        });
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de l'envoi.",
          type: "danger",
        });
      }
    });
  }

  function onApplyTva() {
    const rate = Number(tvaRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Taux invalide", message: "Entrez un pourcentage entre 0 et 100.", type: "danger" });
      return;
    }
    start(async () => {
      try {
        await applyInvoiceTva(invoice.id, rate);
        toast({ title: "TVA appliquée", message: `${rate}% sur ${invoice.id}`, type: "success" });
        setTvaOpen(false);
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec.",
          type: "danger",
        });
      }
    });
  }

  function onDelete() {
    start(async () => {
      try {
        await deleteInvoice(invoice.id);
        toast({ title: "Facture supprimée", type: "success" });
        setDeleteOpen(false);
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de la suppression.",
          type: "danger",
        });
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Link
          href={`/admin/invoices/${invoice.id}/print`}
          target="_blank"
          className="inline-flex items-center justify-center rounded-md p-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-accent"
          title="Imprimer"
        >
          <Printer className="h-4 w-4" />
        </Link>
        {!invoice.sentToClient && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={onSend}
            disabled={pending}
            title="Publier dans l'espace pro + WhatsApp"
          >
            <Send className="h-3.5 w-3.5" /> Envoyer
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTvaOpen(true)}
          disabled={pending}
          title="Appliquer la TVA"
        >
          <Percent className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:text-danger"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
          title="Supprimer la facture"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Modal open={tvaOpen} onClose={() => setTvaOpen(false)} title="Appliquer la TVA" size="sm">
        <p className="mb-3 text-sm text-text-3">
          Montant TTC actuel : {invoice.amount} MAD. Indiquez le taux de TVA à appliquer.
        </p>
        <Field>
          <Label htmlFor="tva-rate">Taux de TVA (%)</Label>
          <Input
            id="tva-rate"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={tvaRate}
            onChange={(e) => setTvaRate(e.target.value)}
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setTvaOpen(false)}>
            Annuler
          </Button>
          <Button onClick={onApplyTva} disabled={pending}>
            Valider
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer la facture"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={pending}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-text-2">
          Supprimer définitivement la facture <strong>{invoice.id}</strong> ?
        </p>
      </Modal>
    </>
  );
}
