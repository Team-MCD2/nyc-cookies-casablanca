"use client";

import { useEffect } from "react";
import { PrintButton } from "@/components/print-button";

export function InvoicePrintShell({
  children,
  autoPrint = true,
}: {
  children: React.ReactNode;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />
      <PrintButton />
      {children}
    </>
  );
}
