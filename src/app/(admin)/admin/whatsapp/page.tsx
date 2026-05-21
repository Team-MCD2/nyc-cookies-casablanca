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
  connecting?: boolean;
  qr: string | null;
  pairingCode: string | null;
  qrError?: string | null;
  cronTime: string;
  cronTimezone?: string;
  additionalPhones?: string[];
  authorizedPhones?: string[];
  authorizedPhone?: string;
};

const BOT_COMMANDS = [
  { cmd: ".menu", desc: "Menu des commandes (avec logo NYC)" },
  { cmd: ".ping", desc: "Tester la connexion du bot" },
  { cmd: ".update", desc: "Résumé admin (commandes, demandes pro, factures)" },
  { cmd: ".commandes", desc: "Commandes en attente (.commandes active / prep / tout)" },
  { cmd: ".commande REF", desc: "Détail d'une commande (articles, client, statut)" },
  { cmd: ".statut REF prep", desc: "Changer le statut (attente, prep, pret, livre, annule)" },
  { cmd: ".avancer REF", desc: "Passer au statut suivant (attente → prépa → prête → livrée)" },
  { cmd: ".ventes", desc: "CA et stats du jour (fuseau Maroc)" },
  { cmd: ".demandes", desc: "Demandes compte pro en attente" },
  { cmd: ".stock", desc: "Produits en stock bas (option : .stock 5)" },
  { cmd: ".produits", desc: "Catalogue actif avec niveaux de stock" },
  { cmd: ".pro", desc: "Liste des clients pro avec numéros" },
  { cmd: ".prosend NUMERO : Message", desc: "Message personnalisé à un pro" },
  { cmd: ".creneau HH:mm", desc: "Heure des rappels automatiques (fuseau Maroc)" },
  { cmd: ".authorise NUMERO", desc: "Autoriser un numéro admin" },
  { cmd: ".unauthorise NUMERO", desc: "Retirer l'autorisation d'un numéro" },
] as const;

const AUTO_NOTIFICATIONS = [
  "Nouvelle commande (B2C ou Pro)",
  "Nouvelle demande de compte Pro",
] as const;

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [authorizedPhoneInput, setAuthorizedPhoneInput] = useState("");
  const [cronTimeInput, setCronTimeInput] = useState("");
  const [method, setMethod] = useState<"qr" | "pairing_code">("pairing_code");
  const [actionLoading, setActionLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);


  async function fetchStatus(showToast = false, silent = false) {
    try {
      if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      const linking =
        isConnecting ||
        status?.connecting ||
        (status && !status.connected && (status.qr || status.pairingCode));
      if (linking) fetchStatus(false, true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnecting, status?.connected, status?.connecting, status?.qr, status?.pairingCode]);

  useEffect(() => {
    if (status?.connected) {
      setIsConnecting(false);
      return;
    }
    if (status?.connecting) {
      setIsConnecting(true);
      return;
    }
    if (!status?.qr && !status?.pairingCode && !status?.connecting) {
      setIsConnecting(false);
    }
  }, [status?.connected, status?.connecting, status?.qr, status?.pairingCode]);

  // Sync numéros autorisés (dashboard + commandes .authorise sur WhatsApp)
  useEffect(() => {
    if (!status?.connected) return;
    const interval = setInterval(() => fetchStatus(false, true), 5000);
    return () => clearInterval(interval);
  }, [status?.connected]);

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
          message: "Tous les numéros additionnels ont été retirés.",
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
        toast({
          title: "Heure enregistrée",
          message: `Rappels à ${cronTimeInput} (heure du Maroc).`,
          type: "success",
        });
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
      {status && !status.connected && (status.connecting || status.qr || status.pairingCode || status.qrError) && (
        <Card className="flex flex-col gap-6 p-6">
          <h2 className="font-display text-xl">Codes de Connexion Actifs</h2>

          {status.qrError && !status.qr && !status.pairingCode && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-text-2">
              {status.qrError}
            </div>
          )}

          {status.connecting && !status.qr && !status.pairingCode && !status.qrError && (
            <p className="text-text-3 text-sm text-center animate-pulse">
              Génération du code en cours… (quelques secondes)
            </p>
          )}
          
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

      <Card className="p-6">
        <h2 className="font-display text-xl mb-4">Commandes WhatsApp</h2>
        <p className="text-sm text-text-3 mb-4">
          Réservées aux numéros autorisés. Tapez <code className="text-accent">.menu</code> sur WhatsApp pour le menu complet.
        </p>
        <div className="mb-4 rounded-md border border-accent/20 bg-accent/5 p-3 text-sm">
          <p className="font-medium text-text mb-2">Notifications automatiques</p>
          <p className="text-text-3 text-xs mb-2">
            Envoyées à <strong>tous les numéros autorisés</strong> ci-dessous :
          </p>
          <ul className="list-disc pl-5 text-text-3 text-xs space-y-0.5">
            {AUTO_NOTIFICATIONS.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {BOT_COMMANDS.map(({ cmd, desc }) => (
            <div
              key={cmd}
              className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm"
            >
              <code className="text-accent font-mono text-[0.85rem]">{cmd}</code>
              <p className="mt-1 text-text-3 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

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

          {status?.qrError && !status.connected && !status.qr && !status.pairingCode && (
            <p className="text-sm text-danger/90">{status.qrError}</p>
          )}

          {/* Disconnected State (Ready to connect) */}
          {status && !status.connected && !status.connecting && !status.qr && !status.pairingCode && (
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
            <Field>
              <Label>Ajouter un numéro autorisé</Label>
              <Input
                placeholder="212612345678"
                value={authorizedPhoneInput}
                onChange={e => setAuthorizedPhoneInput(e.target.value)}
              />
              <p className="text-xs text-text-3 mt-1">
                Ajout ici ou via WhatsApp (<code className="text-accent">.authorise NUMERO</code>).
                La liste se met à jour automatiquement.
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
                Tout supprimer
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-text-2">
                Numéros autorisés ({status?.additionalPhones?.length ?? 0})
              </p>
              {status?.additionalPhones && status.additionalPhones.length > 0 ? (
                <ul className="space-y-2">
                  {status.additionalPhones.map((num) => (
                    <li
                      key={num}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
                    >
                      <span className="font-mono text-sm">{num}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-soft"
                        disabled={actionLoading}
                        onClick={() => removeAuthorizedPhone(num)}
                        title="Retirer ce numéro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-3 rounded-md border border-dashed border-border px-3 py-4 text-center">
                  Aucun numéro additionnel. Ajoutez-en ici ou via <code className="text-accent">.authorise</code> sur WhatsApp.
                </p>
              )}
            </div>
          </div>

          <hr className="border-border" />

          <p className="text-sm text-text-2">
            Heure d&apos;envoi automatique des rappels aux Pros actifs.
          </p>
          <div className="flex flex-col gap-4">
            <Field>
              <Label>Heure d&apos;envoi (Format HH:mm)</Label>
              <Input 
                type="time" 
                value={cronTimeInput} 
                onChange={e => setCronTimeInput(e.target.value)}
              />
              <p className="text-xs text-text-3 mt-1">
                Fuseau horaire :{" "}
                <span className="font-medium text-text-2">
                  {status?.cronTimezone ?? "Africa/Casablanca"}
                </span>{" "}
                (heure du Maroc)
              </p>
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
