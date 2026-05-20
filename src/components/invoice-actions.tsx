"use client";

import { useState } from "react";
import { Mail, Printer, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { sendInvoiceEmail } from "@/lib/actions";
import Link from "next/link";

interface InvoiceActionsProps {
  reference: string;
  proEmail?: string;
  showViewButton?: boolean;
}

export function InvoiceActions({ reference, proEmail, showViewButton = true }: InvoiceActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const res = await sendInvoiceEmail(reference);
      if (res.success) {
        toast({
          title: "Facture envoyée",
          message: res.message,
          type: "success",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        message: err.message || "Impossible d'envoyer la facture.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {showViewButton && (
        <Link href={`/pro/invoices/${reference}`}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Détails de la facture">
            <Eye className="h-3.5 w-3.5 text-text-3 hover:text-accent" />
          </Button>
        </Link>
      )}
      <Link href={`/pro/invoices/${reference}?print=true`} target="_blank">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Imprimer la facture">
          <Printer className="h-3.5 w-3.5 text-text-3 hover:text-accent" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title={proEmail ? `Envoyer par mail à ${proEmail}` : "Envoyer par mail"}
        onClick={handleSendEmail}
        disabled={loading}
      >
        <Mail className={`h-3.5 w-3.5 text-text-3 hover:text-accent ${loading ? "animate-pulse" : ""}`} />
      </Button>
    </div>
  );
}
