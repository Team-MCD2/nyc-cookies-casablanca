"use client";

import { Printer, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InvoiceActionsProps {
  reference: string;
  showViewButton?: boolean;
}

export function InvoiceActions({ reference, showViewButton = true }: InvoiceActionsProps) {
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
    </div>
  );
}
