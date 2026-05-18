"use client";

import { useState } from "react";
import { Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { sendOrderReceiptEmail } from "@/lib/actions";

interface OrderActionsProps {
  reference: string;
  customerEmail?: string;
}

export function OrderActions({ reference, customerEmail }: OrderActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const res = await sendOrderReceiptEmail(reference);
      if (res.success) {
        toast({
          title: "Reçu envoyé",
          message: res.message,
          type: "success",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        message: err.message || "Impossible d'envoyer le reçu.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Imprimer
      </Button>
      <Button variant="primary" size="sm" onClick={handleSendEmail} disabled={loading}>
        <Mail className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} /> Envoyer par mail
      </Button>
    </div>
  );
}
