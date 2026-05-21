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
      <PrintButton />
      {children}
    </>
  );
}
