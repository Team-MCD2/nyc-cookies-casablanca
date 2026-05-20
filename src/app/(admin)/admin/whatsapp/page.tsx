"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<{ connected: boolean; qr: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      setLoading(true);
      // Use environment variable or default to localhost for local dev
      const botUrl = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || "http://localhost:3001";
      const res = await fetch(`${botUrl}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Bot is not reachable", error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds if not connected to refresh the QR or catch the connection
    const interval = setInterval(() => {
      if (!status?.connected) {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status?.connected]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Connexion WhatsApp" 
        subtitle="Scannez le QR code pour lier le bot d'envoi de messages."
      />

      <Card className="max-w-md p-6 flex flex-col gap-6 items-center text-center">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl">Statut du Bot</h2>
          {status?.connected ? (
            <Badge variant="success">Connecté</Badge>
          ) : (
            <Badge variant="danger">Déconnecté</Badge>
          )}
        </div>

        {loading && !status && <p className="text-text-3">Vérification de la connexion...</p>}
        
        {!loading && !status && (
          <div className="text-accent bg-accent/10 p-4 rounded-md text-sm text-left">
            Impossible de contacter le serveur du bot (port 3001). Assurez-vous que le service Node.js du bot est lancé.
          </div>
        )}

        {status?.qr && !status.connected && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-text-2 text-sm">Ouvrez WhatsApp sur votre téléphone &gt; Appareils liés &gt; Lier un appareil, puis scannez ce code :</p>
            <div className="bg-white p-2 rounded-xl">
              <img src={status.qr || ""} alt="QR Code WhatsApp" width={256} height={256} className="rounded-lg" />
            </div>
          </div>
        )}

        {status?.connected && (
          <p className="text-text-2">
            Le bot est prêt. Les relances automatiques de 20h00 seront envoyées depuis ce numéro.
          </p>
        )}

        <Button onClick={fetchStatus} variant="secondary" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Rafraîchir
        </Button>
      </Card>
    </div>
  );
}
