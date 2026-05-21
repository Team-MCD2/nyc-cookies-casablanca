"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Label, Input } from "@/components/ui/input";
import { RefreshCw, LogOut, Save, Smartphone, QrCode, Play, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

type BotStatus = {
  connected: boolean;
  qr: string | null;
  pairingCode: string | null;
  cronTime: string;
  mandatoryPhone?: string;
  additionalPhones?: string[];
  authorizedPhones?: string[];
  authorizedPhone?: string;
};

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [authorizedPhoneInput, setAuthorizedPhoneInput] = useState("");
  const [cronTimeInput, setCronTimeInput] = useState("");
  const [method, setMethod] = useState<"qr" | "pairing_code">("pairing_code");
  const [actionLoading, setActionLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);


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
        setAuthorizedPhoneInput("");
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
      // Poll if not connected but trying to connect (has QR, code, or is actively connecting)
      if (isConnecting || (status && !status.connected && (status.qr || status.pairingCode))) {
        fetchStatus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnecting, status?.connected, status?.qr, status?.pairingCode]);

  // Reset connecting state when successfully connected or when connection state becomes available
  useEffect(() => {
    if (status?.connected || (!status?.qr && !status?.pairingCode && !isConnecting)) {
      setIsConnecting(false);
    }
  }, [status?.connected, status?.qr, status?.pairingCode, isConnecting]);

  async function startConnection() {
    if (method === "pairing_code" && !phone) {
      toast({ title: "Erreur", message: "Entrez un numéro de téléphone.", type: "danger" });
      return;
    }
    setActionLoading(true);
    setIsConnecting(true);
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
        setIsConnecting(false);
      }
    } catch (e) {
      toast({ title: "Erreur", message: "Le bot est inaccessible.", type: "danger" });
      setIsConnecting(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function logoutBot() {
    setActionLoading(true);
    setIsConnecting(false);
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

  async function addAuthorizedPhone() {
    const normalized = authorizedPhoneInput.replace(/\D/g, "");
    if (!normalized || normalized.length < 9) {
      toast({ title: "Erreur", message: "Entrez un numéro valide (ex: 212612345678).", type: "danger" });
      return;
    }
    if (normalized === status?.mandatoryPhone) {
      toast({ title: "Info", message: "Ce numéro est déjà autorisé en permanence.", type: "default" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=set-authorized-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      if (res.ok) {
        setAuthorizedPhoneInput("");
        toast({ title: "Numéro ajouté", message: `${normalized} peut utiliser les commandes du bot.`, type: "success" });
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", message: data.error || "Impossible d'ajouter.", type: "danger" });
      }
    } catch {
      toast({ title: "Erreur", message: "Le bot est inaccessible.", type: "danger" });
    } finally {
      setActionLoading(false);
    }
  }

  async function removeAuthorizedPhone(phone: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=remove-authorized-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        toast({ title: "Numéro retiré", message: phone, type: "success" });
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", message: data.error || "Impossible de retirer.", type: "danger" });
      }
    } catch {
      toast({ title: "Erreur", message: "Le bot est inaccessible.", type: "danger" });
    } finally {
      setActionLoading(false);
    }
  }

  async function clearAdditionalPhones() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp?action=clear-authorized-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setAuthorizedPhoneInput("");
        toast({
          title: "Liste vidée",
          message: `Les numéros additionnels ont été retirés. ${status?.mandatoryPhone} reste toujours autorisé.`,
          type: "success",
        });
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", message: data.error || "Impossible de supprimer.", type: "danger" });
      }
    } catch {
      toast({ title: "Erreur", message: "Le bot est inaccessible.", type: "danger" });
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

      {/* QR Code / Pairing Code Display Section */}
      {status && !status.connected && (status.qr || status.pairingCode) && (
        <Card className="flex flex-col gap-6 p-6">
          <h2 className="font-display text-xl">Codes de Connexion Actifs</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pairing Code */}
            {status.pairingCode && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-accent" />
                  <p className="text-text-2 font-medium">Code d'Appairage</p>
                </div>
                <p className="text-text-3 text-sm text-center">Entrez ce code sur WhatsApp &gt; Appareils liés &gt; Lier avec numéro :</p>
                <div className="bg-surface-2 p-6 rounded-xl border border-border-strong text-center w-full">
                  <span className="font-mono text-4xl font-bold tracking-widest">{status.pairingCode}</span>
                </div>
              </div>
            )}

            {/* QR Code */}
            {status.qr && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-accent" />
                  <p className="text-text-2 font-medium">Code QR</p>
                </div>
                <p className="text-text-3 text-sm text-center">Scannez ce QR code dans WhatsApp &gt; Appareils liés :</p>
                <div className="bg-white p-4 rounded-xl inline-block border border-border-strong">
                  <img src={status.qr} alt="QR Code" width={220} height={220} className="rounded-lg" />
                </div>
              </div>
            )}
          </div>

          <Button onClick={logoutBot} variant="ghost" className="mx-auto">
            Annuler
          </Button>
        </Card>
      )}

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
                  <Label>Numéro WhatsApp du bot (connexion)</Label>
                  <Input 
                    placeholder="212600000000" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-text-3 mt-1">Le compte WhatsApp lié au bot. Ex: 212612345678</p>
                </Field>
              )}

              <Button onClick={startConnection} disabled={actionLoading}>
                <Play className="mr-2 h-4 w-4" /> 
                {method === "pairing_code" ? "Générer le Code" : "Générer le QR"}
              </Button>
            </div>
          )}
        </Card>

        {/* CONFIGURATION */}
        <Card className="flex flex-col gap-6 p-6">
          <h2 className="font-display text-xl">Configuration</h2>

          <div className="flex flex-col gap-4">
            {status?.mandatoryPhone && (
              <div className="rounded-md border border-accent/30 bg-accent/10 p-3">
                <p className="text-xs text-text-3 mb-1">Numéro obligatoire (toujours autorisé)</p>
                <p className="font-mono font-semibold text-accent">{status.mandatoryPhone}</p>
              </div>
            )}

            <Field>
              <Label>Ajouter un numéro autorisé</Label>
              <Input
                placeholder="212612345678"
                value={authorizedPhoneInput}
                onChange={e => setAuthorizedPhoneInput(e.target.value)}
              />
              <p className="text-xs text-text-3 mt-1">
                Numéros pouvant utiliser .ping, .pro, .creneau, etc. (en plus du numéro obligatoire).
              </p>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={addAuthorizedPhone}
                disabled={actionLoading || !authorizedPhoneInput || !status}
                variant="primary"
              >
                <Save className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button
                onClick={clearAdditionalPhones}
                disabled={
                  actionLoading ||
                  !status ||
                  !(status.additionalPhones && status.additionalPhones.length > 0)
                }
                variant="danger"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Tout supprimer (sauf obligatoire)
              </Button>
            </div>

            {status?.authorizedPhones && status.authorizedPhones.length > 0 && (
              <ul className="space-y-2">
                <p className="text-xs font-medium text-text-2">Numéros autorisés actuellement</p>
                {status.authorizedPhones.map((num) => {
                  const isMandatory = num === status.mandatoryPhone;
                  return (
                    <li
                      key={num}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
                    >
                      <span className="font-mono text-sm">{num}</span>
                      {isMandatory ? (
                        <Badge variant="success">Obligatoire</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-soft"
                          disabled={actionLoading}
                          onClick={() => removeAuthorizedPhone(num)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <hr className="border-border" />

          <div className="rounded-md border border-border bg-surface-2 p-4 text-sm text-text-2">
            <p className="font-medium text-text mb-2">Commandes WhatsApp (numéro autorisé)</p>
            <ul className="list-disc pl-5 space-y-1 text-text-3">
              <li><code className="text-accent">.pro</code> — liste des clients pro avec numéros</li>
              <li><code className="text-accent">.prosend 212612345678 : Message</code> — message personnalisé à un pro</li>
              <li><code className="text-accent">.ping</code> — test de connexion</li>
              <li><code className="text-accent">.creneau 20:00</code> — heure des rappels auto</li>
            </ul>
          </div>

          <hr className="border-border" />

          <p className="text-sm text-text-2">
            Heure d'envoi automatique des rappels aux Pros actifs.
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
              Enregistrer l'heure d'envoi
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
