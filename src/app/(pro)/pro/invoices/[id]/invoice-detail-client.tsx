"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { sendInvoiceEmail } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import { SITE } from "@/lib/site";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface InvoiceDetailClientProps {
  invoice: {
    id: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    status: string;
  };
  pro: {
    company: string;
    contactName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    ice?: string | null;
  };
  lineItems: Array<{
    pid: string;
    name: string;
    desc: string;
    category: string;
    qty: number;
    unit: number;
    subtotal: number;
  }>;
}

export function InvoiceDetailClient({ invoice, pro, lineItems }: InvoiceDetailClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("print") === "true") {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const res = await sendInvoiceEmail(invoice.id);
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
    <div className="stack-lg max-w-4xl mx-auto py-6">
      {/* Action Bar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/pro/invoices"
          className="inline-flex items-center gap-1.5 text-[0.9rem] text-text-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux factures
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button variant="primary" size="sm" onClick={handleSendEmail} disabled={loading}>
            <Mail className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} /> Envoyer par mail
          </Button>
        </div>
      </div>

      {/* Corporate Styled Invoice Sheet */}
      <Card className="p-8 md:p-12 bg-white text-black border border-border shadow-lg print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-display uppercase font-bold tracking-tight text-black">
              {SITE.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{SITE.fullName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{SITE.city}</p>
          </div>
          <div className="text-left md:text-right">
            <h2 className="text-2xl font-semibold uppercase tracking-wider text-gray-800">
              FACTURE
            </h2>
            <p className="text-lg font-mono font-medium text-gray-900 mt-1">
              {invoice.id}
            </p>
            <div className="mt-2 flex items-center md:justify-end gap-2 print:hidden">
              <span className="text-xs uppercase text-gray-500 font-medium">Statut:</span>
              <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"}>
                {invoice.status === "paid" ? "Payée" : invoice.status === "overdue" ? "En retard" : "À payer"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Client & Company Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-gray-200">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">
              Émetteur
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{SITE.fullName}</p>
              <p>{SITE.address.street}</p>
              {SITE.address.complement && <p>{SITE.address.complement}</p>}
              <p>{SITE.address.city}, {SITE.address.country}</p>
              <p className="pt-1">Tél: {SITE.phoneDisplay}</p>
              <p>Email: {SITE.email}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">
              Facturé à
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{pro.company}</p>
              <p className="text-gray-500 text-xs">Contact: {pro.contactName}</p>
              {pro.address ? <p>{pro.address}</p> : <p className="text-gray-400 italic">Adresse non fournie</p>}
              {pro.ice && <p className="font-mono text-xs text-gray-600">ICE: {pro.ice}</p>}
              <p className="pt-1">Tél: {pro.phone || "—"}</p>
              <p>Email: {pro.email}</p>
            </div>
          </div>
        </div>

        {/* Dates & Terms */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-gray-200 text-sm">
          <div>
            <span className="block text-xs text-gray-400 font-bold uppercase">Date de facturation</span>
            <span className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-400 font-bold uppercase">Date d'échéance</span>
            <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-400 font-bold uppercase">Conditions</span>
            <span className="font-medium text-gray-900">Paiement à réception</span>
          </div>
          <div className="text-right">
            <span className="block text-xs text-gray-400 font-bold uppercase">Total à payer</span>
            <span className="font-bold text-gray-900 text-lg tabular-nums">{money(invoice.amount)}</span>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="py-8">
          <table className="w-full text-left text-sm text-gray-700">
            <thead>
              <tr className="border-b border-gray-300 pb-3 text-xs uppercase text-gray-400 font-bold">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Quantité</th>
                <th className="py-2 text-right">Prix Unitaire</th>
                <th className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length > 0 ? (
                lineItems.map((li) => (
                  <tr key={li.pid} className="border-b border-gray-100">
                    <td className="py-4">
                      <p className="font-bold text-gray-900">{li.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{li.desc}</p>
                    </td>
                    <td className="py-4 text-right tabular-nums font-medium">{li.qty}</td>
                    <td className="py-4 text-right tabular-nums">{money(li.unit)}</td>
                    <td className="py-4 text-right tabular-nums font-bold text-gray-900">{money(li.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-bold text-gray-900">Commande NYC Cookies</p>
                    <p className="text-xs text-gray-400 font-light">Prestation de cookies artisanaux sur mesure</p>
                  </td>
                  <td className="py-4 text-right tabular-nums font-medium">1</td>
                  <td className="py-4 text-right tabular-nums">{money(invoice.amount)}</td>
                  <td className="py-4 text-right tabular-nums font-bold text-gray-900">{money(invoice.amount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-8 border-t border-gray-200">
          <div className="text-xs text-gray-400 max-w-sm space-y-1.5">
            <h4 className="font-bold uppercase text-gray-500">Mentions & Conditions</h4>
            <p>Le paiement est exigible selon les termes convenus. Tout retard de paiement donnera lieu de plein droit à des pénalités de retard.</p>
            <p>NYC Cookies Casablanca — ICE: {pro.ice || "—"}</p>
          </div>
          <div className="w-full md:w-64 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span className="tabular-nums font-medium">{money(invoice.amount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-gray-900">
              <span>Total Net (MAD)</span>
              <span className="tabular-nums">{money(invoice.amount)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
