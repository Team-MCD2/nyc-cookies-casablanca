"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Label, Input } from "@/components/ui/input";
import { RefreshCw, LogOut, Save, Smartphone, QrCode, Play } from "lucide-react";
import { toast } from "@/components/ui/toaster";

type BotStatus = {
  connected: boolean;
  qr: string | null;
  pairingCode: string | null;
  cronTime: string;
};

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [cronTimeInput, setCronTimeInput] = useState("");
  const [method, setMethod] = useState<"qr" | "pairing_code">("pairing_code");
  const [actionLoading, setActionLoading] = useState(false);


  async function fetchStatus(showToast = false) {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (!cronTimeInput && data.cronTime) {
          setCronTimeInput(data.cronTime);
        }
        if (showToast) toast({ title: "Statut mis à jour", type: "success" });
      } else {
        setStatus(null);
      }
    } catch (error) {
      console.error("Bot is not reachable via proxy", error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      // Poll if not connected but trying to connect (has QR or code)
      if (status && !status.connected && (status.qr || status.pairingCode)) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status?.connected, status?.qr, status?.pairingCode]);

  async function startConnection() {
    if (method === "pairing_code" && !phone) {
      toast({ title: "Erreur", message: "Entrez un numéro de téléphone.", type: "danger" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phone })
      });
      if (res.ok) {
        toast({ title: "Démarrage en cours", message: "Génération du code...", type: "success" });
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", message: data.error || "Impossible de démarrer.", type: "danger" });
      }
    } catch (e) {
      toast({ title: "Erreur", message: "Le bot est inaccessible.", type: "danger" });
    } finally {
      setActionLoading(false);
    }
  }

  async function logoutBot() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=logout", { method: "POST" });
      if (res.ok) {
        toast({ title: "Déconnecté", message: "Le bot a été réinitialisé.", type: "success" });
      } else {
        toast({ title: "Erreur", message: "Impossible de se déconnecter.", type: "danger" });
      }
      await fetchStatus();
    } catch (e) {
      toast({ title: "Erreur", message: "Impossible de se déconnecter.", type: "danger" });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveCronTime() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=set-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: cronTimeInput })
      });
      if (res.ok) {
        toast({ title: "Heure enregistrée", message: "Le bot a été redémarré avec le nouveau créneau.", type: "success" });
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", message: data.error || "Format invalide.", type: "danger" });
      }
    } catch (e) {
      toast({ title: "Erreur", message: "Impossible d'enregistrer l'heure.", type: "danger" });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Bot WhatsApp" 
        subtitle="Gérez l'envoi automatique des rappels de commande aux pros."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* CONNEXION BOT */}
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Statut de Connexion</h2>
            {status?.connected ? (
              <Badge variant="success">Connecté</Badge>
            ) : (
              <Badge variant="danger">Déconnecté</Badge>
            )}
          </div>

          {loading && !status && <p className="text-text-3">Vérification...</p>}
          
          {!loading && !status && (
            <div className="text-accent bg-accent/10 p-4 rounded-md text-sm">
              Impossible de contacter le serveur du bot. Assurez-vous qu'il est en cours d'exécution.
            </div>
          )}

          {/* Connected State */}
          {status?.connected && (
            <div className="flex flex-col gap-4">
              <p className="text-text-2">
                Le bot est connecté et prêt à envoyer des messages.
              </p>
              <Button onClick={logoutBot} variant="danger" disabled={actionLoading}>
                <LogOut className="mr-2 h-4 w-4" /> Déconnecter le bot
              </Button>
            </div>
          )}

          {/* Disconnected State (Ready to connect) */}
          {status && !status.connected && !status.qr && !status.pairingCode && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button 
                  variant={method === "pairing_code" ? "primary" : "secondary"} 
                  onClick={() => setMethod("pairing_code")}
                  className="flex-1"
                >
                  <Smartphone className="mr-2 h-4 w-4" /> Code (Nouveau)
                </Button>
                <Button 
                  variant={method === "qr" ? "primary" : "secondary"} 
                  onClick={() => setMethod("qr")}
                  className="flex-1"
                >
                  <QrCode className="mr-2 h-4 w-4" /> QR Code
                </Button>
              </div>

              {method === "pairing_code" && (
                <Field>
                  <Label>Numéro de téléphone du Bot (avec indicatif)</Label>
                  <Input 
                    placeholder="212600000000" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-text-3 mt-1">Exemple: 212612345678 (pas de + ni de 0 au début)</p>
                </Field>
              )}

              <Button onClick={startConnection} disabled={actionLoading}>
                <Play className="mr-2 h-4 w-4" /> 
                {method === "pairing_code" ? "Générer le Code" : "Générer le QR"}
              </Button>
            </div>
          )}

          {/* Waiting for Pairing Code validation */}
          {status && !status.connected && status.pairingCode && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-text-2 text-sm text-center">Entrez ce code sur WhatsApp &gt; Appareils liés &gt; Lier avec numéro :</p>
              <div className="bg-surface-2 p-4 rounded-xl border border-border-strong text-center">
                <span className="font-mono text-3xl font-bold tracking-widest">{status.pairingCode}</span>
              </div>
              <Button onClick={logoutBot} variant="ghost" size="sm">Annuler</Button>
            </div>
          )}

          {/* Waiting for QR Code scan */}
          {status && !status.connected && status.qr && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-text-2 text-sm text-center">Scannez ce QR code dans WhatsApp &gt; Appareils liés :</p>
              <div className="bg-white p-2 rounded-xl inline-block">
                <img src={status.qr} alt="QR Code" width={200} height={200} className="rounded-lg" />
              </div>
              <Button onClick={logoutBot} variant="ghost" size="sm">Annuler</Button>
            </div>
          )}
        </Card>

        {/* CONFIGURATION CRON */}
        <Card className="flex flex-col gap-6 p-6">
          <h2 className="font-display text-xl">Configuration de l'envoi</h2>
          <p className="text-sm text-text-2">
            Réglez l'heure à laquelle le bot enverra automatiquement le message de relance à tous les Pros actifs.
          </p>

          <div className="flex flex-col gap-4">
            <Field>
              <Label>Heure d'envoi (Format HH:mm)</Label>
              <Input 
                type="time" 
                value={cronTimeInput} 
                onChange={e => setCronTimeInput(e.target.value)}
              />
            </Field>
            <Button 
              onClick={saveCronTime} 
              disabled={actionLoading || !cronTimeInput || !status}
              variant="secondary"
            >
              <Save className="mr-2 h-4 w-4" /> 
              Enregistrer & Redémarrer le Bot
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => fetchStatus(true)} variant="ghost">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualiser l'état
        </Button>
      </div>
    </div>
  );
}
