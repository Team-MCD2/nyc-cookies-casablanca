"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Copy, X, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Field, Label, Input, InputGroup, Select } from "@/components/ui/input";
import { ProStatusBadge } from "@/components/status-badge";
import { TableWrap, Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { deletePro, deleteInvitation, updateProRequestStatus, deleteProRequest, createInvitation, updatePro } from "@/lib/actions";
import { money, formatDate } from "@/lib/utils";
import type { Pro, Invitation, ProRequest } from "@/lib/types";
import { InviteProForm } from "./invite-form";

interface Props {
  pros: Pro[];
  invitations: Invitation[];
  proRequests?: ProRequest[];
}

export function ProsClient({ pros, invitations, proRequests }: Props) {
  const [query, setQuery] = useState("");
  const [confirmDeletePro, setConfirmDeletePro] = useState<Pro | null>(null);
  const [editingPro, setEditingPro] = useState<Pro | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pros;
    return pros.filter(
      (p) =>
        p.company.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }, [pros, query]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-sm sm:flex-1">
          <InputGroup
            icon={<Search className="h-4 w-4" />}
            placeholder="Rechercher société, contact, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <InviteProForm />
      </div>

      {pros.length === 0 ? (
        <Empty title="Aucun partenaire pro pour l'instant">
          Cliquez sur <strong>Inviter un pro</strong> pour générer un lien d'inscription
          à envoyer à votre prochain partenaire B2B (café, hôtel, pâtisserie…).
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty title="Aucun résultat">Aucun pro ne correspond à votre recherche.</Empty>
      ) : (
        <Card className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Société</Th>
                  <Th>Contact</Th>
                  <Th className="text-right">Cmds</Th>
                  <Th className="text-right">CA</Th>
                  <Th className="text-right">Encours</Th>
                  <Th>Délai</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.company} size="sm" />
                        <div>
                          <div className="font-semibold">{p.company}</div>
                          <div className="text-[0.85rem] text-text-3">{p.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-[0.9rem]">
                      <div>{p.contactName}</div>
                      {p.phone && (
                        <div className="text-[0.82rem] text-text-3">{p.phone}</div>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{p.ordersCount}</Td>
                    <Td className="text-right tabular-nums">{money(p.totalSpent)}</Td>
                    <Td className="text-right tabular-nums">
                      <span className={p.outstanding > 0 ? "text-warning" : ""}>
                        {money(p.outstanding)}
                      </span>
                    </Td>
                    <Td>{p.paymentTerms}j</Td>
                    <Td>
                      <ProStatusBadge status={p.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPro(p)}
                          title="Modifier ce pro"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeletePro(p)}
                          title="Supprimer ce pro"
                          aria-label="Supprimer"
                          className="hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {proRequests && proRequests.filter(r => r.status === "pending").length > 0 && (
        <Card className="mb-6">
          <h3 className="mb-4 font-display text-[1.1rem] tracking-[0.04em] text-accent">
            Demandes d'inscription en attente ({proRequests.filter(r => r.status === "pending").length})
          </h3>
          <ul className="stack-sm">
            {proRequests.filter(r => r.status === "pending").map((req) => (
              <ProRequestRow key={req.id} request={req} />
            ))}
          </ul>
        </Card>
      )}

      {invitations.length > 0 && (
        <Card className="mt-6">
          <h3 className="mb-4 font-display text-[1.1rem] tracking-[0.04em]">
            Invitations en attente ({invitations.length})
          </h3>
          <ul className="stack-sm">
            {invitations.map((inv) => (
              <InvitationRow key={inv.token} invitation={inv} />
            ))}
          </ul>
        </Card>
      )}

      <EditProModal pro={editingPro} onClose={() => setEditingPro(null)} />
      <DeleteProModal pro={confirmDeletePro} onClose={() => setConfirmDeletePro(null)} />
    </>
  );
}

function EditProModal({ pro, onClose }: { pro: Pro | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pro) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: pro.id,
      company: String(fd.get("company") ?? "").trim(),
      contactName: String(fd.get("contactName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      address: String(fd.get("address") ?? "").trim() || null,
      ice: String(fd.get("ice") ?? "").trim() || null,
      paymentTerms: Number(fd.get("paymentTerms") ?? 30),
      status: String(fd.get("status") ?? "active") as "active" | "inactive",
    };

    if (!payload.company || !payload.contactName || !payload.email) {
      setError("Société, contact et email sont requis.");
      return;
    }

    start(async () => {
      try {
        await updatePro(payload);
        toast({ title: "Pro mis à jour", message: payload.company, type: "success" });
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      }
    });
  }

  return (
    <Modal
      open={!!pro}
      onClose={onClose}
      title={pro ? `Modifier — ${pro.company}` : "Modifier le pro"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" form="edit-pro-form" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      {pro && (
        <form id="edit-pro-form" onSubmit={onSubmit} className="stack">
          <Field>
            <Label htmlFor="company">Société</Label>
            <Input id="company" name="company" defaultValue={pro.company} required />
          </Field>
          <Field>
            <Label htmlFor="contactName">Nom du contact</Label>
            <Input id="contactName" name="contactName" defaultValue={pro.contactName} required />
          </Field>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={pro.email} required />
          </Field>
          <Field>
            <Label htmlFor="phone">Téléphone WhatsApp</Label>
            <Input id="phone" name="phone" placeholder="212612345678" defaultValue={pro.phone ?? ""} />
            <p className="mt-1 text-xs text-text-3">Utilisé pour .prosend (indicatif, sans +)</p>
          </Field>
          <Field>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" defaultValue={pro.address ?? ""} />
          </Field>
          <Field>
            <Label htmlFor="ice">ICE</Label>
            <Input id="ice" name="ice" defaultValue={pro.ice ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="paymentTerms">Délai de paiement (jours)</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                type="number"
                min={0}
                max={365}
                defaultValue={pro.paymentTerms}
              />
            </Field>
            <Field>
              <Label htmlFor="status">Statut</Label>
              <Select id="status" name="status" defaultValue={pro.status}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </Select>
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      )}
    </Modal>
  );
}

function ProRequestRow({ request }: { request: ProRequest }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  function approve() {
    start(async () => {
      try {
        const { token } = await createInvitation({
          company: request.company,
          contactName: request.contactName,
          email: request.email,
          phone: request.phone,
        });
        await updateProRequestStatus(request.id, "approved");
        
        const link = `${window.location.origin}/pro-invite?token=${token}`;
        setGeneratedLink(link);
        
        toast({ 
          title: "Demande approuvée ✅", 
          message: "L'invitation a été générée avec succès.", 
          type: "success" 
        });
        
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de l'approbation.",
          type: "danger",
        });
      }
    });
  }

  function reject() {
    start(async () => {
      try {
        await updateProRequestStatus(request.id, "rejected");
        toast({ title: "Demande refusée", message: request.company, type: "default" });
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec du refus.",
          type: "danger",
        });
      }
    });
  }

  return (
    <li className="rounded-md border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{request.company}</span>
            <Badge variant="warning" className="text-[0.7rem]">En attente</Badge>
          </div>
          <div className="mt-1 text-[0.85rem] text-text-3">
            Contact : <strong className="text-text-2">{request.contactName}</strong> · Email : <span className="text-text-2">{request.email}</span> · Tél : <span className="text-text-2">{request.phone}</span>
          </div>
          {request.message && (
            <div className="mt-2 rounded bg-surface-1 p-2 text-xs italic text-text-3">
              "{request.message}"
            </div>
          )}
          
          {generatedLink && (
            <div className="mt-3">
              <span className="text-xs text-accent font-bold">Lien d'onboarding généré :</span>
              <div className="mt-1 flex items-center gap-2">
                <code className="block break-all rounded border border-dashed border-accent/40 bg-surface-1 p-2 font-mono text-[0.75rem] text-accent flex-1">
                  {generatedLink}
                </code>
                <Button 
                  size="sm" 
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedLink);
                    toast({ title: "Lien copié !", type: "success" });
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {!generatedLink && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reject} disabled={pending} className="text-danger hover:bg-danger-soft">
              Refuser
            </Button>
            <Button size="sm" onClick={approve} disabled={pending}>
              Générer invitation
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/pro-invite?token=${invitation.token}`
      : `/pro-invite?token=${invitation.token}`;

  function copyLink() {
    navigator.clipboard
      .writeText(link)
      .then(() => toast({ title: "Lien copié", type: "success" }))
      .catch(() =>
        toast({ title: "Impossible de copier", message: link, type: "warning" }),
      );
  }

  function cancel() {
    start(async () => {
      try {
        await deleteInvitation(invitation.token);
        toast({ title: "Invitation annulée", message: invitation.company, type: "success" });
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec.",
          type: "danger",
        });
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border-strong bg-surface-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{invitation.company}</div>
        <div className="text-[0.85rem] text-text-3">
          {invitation.contactName} · {invitation.email} · créée le {formatDate(invitation.createdAt)}
        </div>
        <code className="mt-1 block break-all font-mono text-[0.72rem] text-accent">
          {link}
        </code>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" /> Copier
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cancel}
          disabled={pending}
          title="Annuler l'invitation"
          aria-label="Annuler l'invitation"
          className="hover:bg-danger-soft hover:text-danger"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function DeleteProModal({
  pro,
  onClose,
}: {
  pro: Pro | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!pro) return;
    start(async () => {
      try {
        await deletePro(pro.id);
        toast({ title: "Pro supprimé", message: pro.company, type: "success" });
        onClose();
        router.refresh();
      } catch (err) {
        toast({
          title: "Erreur",
          message: err instanceof Error ? err.message : "Échec de la suppression.",
          type: "danger",
        });
      }
    });
  }

  return (
    <Modal
      open={!!pro}
      onClose={onClose}
      title="Supprimer le profil pro"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </>
      }
    >
      <p className="text-text-2">
        Confirmer la suppression de <strong className="text-text">{pro?.company}</strong> ?
      </p>
      <p className="mt-2 text-[0.88rem] text-text-3">
        Cela supprime la <em>fiche société</em> côté Supabase. Ses commandes et factures
        passées seront conservées (FK détachée). Le compte Clerk associé n'est pas
        supprimé — utilisez la page <strong>Utilisateurs</strong> pour cela.
      </p>
    </Modal>
  );
}
