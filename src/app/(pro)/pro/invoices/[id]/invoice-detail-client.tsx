"use client";

import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, formatDate } from "@/lib/utils";
import { SITE } from "@/lib/site";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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

  useEffect(() => {
    if (searchParams.get("print") === "true") {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // VAT Logic: only if pro has ICE
  const hasTva = !!pro.ice;
  const totalTtc = invoice.amount;
  const totalHt = hasTva ? Math.round(totalTtc / 1.2) : totalTtc;
  const tvaAmount = totalTtc - totalHt;

  const itemsToRender = lineItems.length > 0
    ? lineItems
    : [{ pid: "default", name: "Commande NYC Cookies", desc: "Prestation de cookies artisanaux sur mesure", qty: 1, unit: totalTtc, subtotal: totalTtc }];

  return (
    <div className="stack-lg max-w-4xl mx-auto py-6 antialiased">
      {/* Action Bar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/pro/invoices"
          className="inline-flex items-center gap-1.5 text-[0.9rem] text-text-3 hover:text-accent font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux factures
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimer
        </Button>
      </div>

      {/* Corporate Styled Invoice Sheet */}
      <Card className="p-8 sm:p-12 bg-white text-[#2b2b2b] border border-border shadow-lg print:border-none print:shadow-none print:p-0 print:m-0">
        
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-gray-200/60 pb-8">
          <div>
            <h1 className="font-serif text-4xl uppercase tracking-wider text-[#3c362f] mb-1 font-light">
              FACTURE
            </h1>
            <p className="font-mono text-sm text-gray-500 tracking-wider">REF: {invoice.id}</p>
            <div className="mt-2 flex items-center gap-2 print:hidden">
              <span className="text-xs uppercase text-gray-400 font-bold">Statut:</span>
              <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"}>
                {invoice.status === "paid" ? "Payée" : invoice.status === "overdue" ? "En retard" : "À payer"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <Image
              src="/nyclogo.png"
              alt="NYC Cookies Logo"
              width={70}
              height={70}
              className="rounded-full border border-gray-200 p-1 mb-2"
            />
            <h2 className="font-serif text-base font-bold text-[#3c362f] tracking-wide">
              {SITE.fullName}
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px] md:text-right leading-relaxed">
              {SITE.address.street}, {SITE.address.city}
            </p>
            <p className="text-xs text-gray-400 mt-1">ICE: 003386290000042</p>
          </div>
        </div>

        {/* Client & Company Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-gray-200/60 text-sm">
          <div>
            <span className="block text-[0.7rem] uppercase tracking-wider text-gray-400 font-bold mb-3">
              DÉTAILS DE FACTURATION
            </span>
            <div className="space-y-1.5 text-gray-700">
              <p><span className="font-medium text-gray-900">Date d'émission :</span> {formatDate(invoice.issueDate)}</p>
              <p><span className="font-medium text-gray-900">Date d'échéance :</span> {formatDate(invoice.dueDate)}</p>
              <p><span className="font-medium text-gray-900">Conditions :</span> Paiement selon conditions convenues</p>
            </div>
          </div>
          <div>
            <span className="block text-[0.7rem] uppercase tracking-wider text-gray-400 font-bold mb-3">
              FACTURÉ À
            </span>
            <div className="space-y-1.5 text-gray-700">
              <h3 className="font-serif text-base font-bold text-gray-900 uppercase">
                {pro.company}
              </h3>
              <p className="text-xs text-gray-500">Contact: {pro.contactName}</p>
              <p className="text-xs leading-relaxed max-w-[280px]">{pro.address || "Adresse non fournie"}</p>
              {pro.ice && (
                <p className="font-mono text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded inline-block">
                  ICE: {pro.ice}
                </p>
              )}
              <p className="text-xs text-gray-500 pt-0.5">Tél: {pro.phone || "—"} | Email: {pro.email}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="py-8">
          <div className="overflow-hidden rounded border border-gray-200/80">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#c0b09c] text-white font-serif tracking-wider text-xs uppercase border-b border-[#c0b09c]">
                  <th className="p-3 border-r border-[#c0b09c]/40 font-medium">Description</th>
                  <th className="p-3 border-r border-[#c0b09c]/40 text-center w-24 font-medium">Quantité</th>
                  <th className="p-3 border-r border-[#c0b09c]/40 text-right w-36 font-medium">Prix Unitaire</th>
                  <th className="p-3 text-right w-40 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {itemsToRender.map((li, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition duration-150"
                  >
                    <td className="p-3 border-r border-gray-100">
                      <p className="font-medium text-gray-900">{li.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{li.desc}</p>
                    </td>
                    <td className="p-3 border-r border-gray-100 text-center font-mono text-gray-800">
                      {li.qty}
                    </td>
                    <td className="p-3 border-r border-gray-100 text-right font-mono text-gray-600">
                      {money(li.unit)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gray-900">
                      {money(li.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Mentions */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-8 border-t border-gray-100">
          <div className="text-xs text-gray-400 max-w-sm space-y-2">
            <h4 className="font-serif font-bold text-gray-500 uppercase tracking-wide">MENTIONS & CONDITIONS</h4>
            <p>Le paiement est exigible selon les termes convenus. Tout retard de paiement donnera lieu de plein droit à des pénalités de retard.</p>
            <p>NYC Cookies Casablanca — ICE: 003386290000042</p>
          </div>
          <div className="w-full md:w-72 space-y-2 text-sm text-gray-700">
            {hasTva ? (
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase text-xs">Total Hors Taxe</span>
                  <span className="font-mono text-gray-800 font-medium">{money(totalHt)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-2">
                  <span className="text-gray-400 font-bold uppercase text-xs">TVA (20%)</span>
                  <span className="font-mono text-gray-800 font-medium">{money(tvaAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-[#c0b09c] pt-2 text-lg font-bold text-[#3c362f] bg-[#c0b09c]/10 p-3 rounded">
                  <span className="font-serif">Total TTC</span>
                  <span className="font-mono">{money(totalTtc)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-lg font-bold text-[#3c362f] bg-[#c0b09c]/10 p-4 rounded">
                <span className="font-serif uppercase text-sm tracking-wider">Total Net</span>
                <span className="font-mono">{money(totalTtc)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank & Payment Info Footer */}
        <div className="border-t border-gray-100 mt-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-500 leading-relaxed">
          <div>
            <h4 className="font-serif font-bold text-gray-800 mb-2 uppercase tracking-wide">
              CONDITIONS DE RÈGLEMENT
            </h4>
            <p>Le règlement s'effectue par espèces à la livraison ou par virement bancaire sous les conditions convenues.</p>
          </div>
          <div>
            <h4 className="font-serif font-bold text-gray-800 mb-2 uppercase tracking-wide">
              INFORMATIONS BANCAIRES
            </h4>
            <div className="bg-gray-50 border border-gray-100 p-3 rounded font-mono space-y-1 text-gray-600">
              <p><span className="text-gray-400">Titulaire:</span> NYC COOKIES SARL</p>
              <p><span className="text-gray-400">Banque:</span> Attijariwafa Bank</p>
              <p className="text-xs break-all"><span className="text-gray-400">IBAN:</span> 007 780 0003559000000519 14</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
