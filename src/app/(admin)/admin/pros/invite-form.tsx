"use client";

import { useState } from "react";
import { Mail, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Label, Input, FieldError } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { createInvitation } from "@/lib/actions";

export function InviteProForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const { token } = await createInvitation({
        company: String(fd.get("company") ?? ""),
        contactName: String(fd.get("contactName") ?? ""),
        email: String(fd.get("email") ?? ""),
      });
      const link = `${window.location.origin}/pro-invite?token=${token}`;
      setGeneratedLink(link);
      toast({ title: "Invitation créée", message: "Lien prêt à partager.", type: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setOpen(false);
    setGeneratedLink(null);
    setError(null);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Inviter un pro
      </Button>

      <Modal
        open={open}
        onClose={reset}
        title={generatedLink ? "Invitation prête" : "Inviter un pro"}
        footer={
          generatedLink ? (
            <>
              <Button variant="ghost" onClick={reset}>Fermer</Button>
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedLink);
                  toast({ title: "Lien copié", type: "success" });
                }}
              >
                <Copy className="h-4 w-4" /> Copier le lien
              </Button>
            </>
          ) : undefined
        }
      >
        {generatedLink ? (
          <>
            <p className="text-text-3">
              Envoyez ce lien à votre nouveau client pro. Il pourra créer son mot de passe et activer son compte.
            </p>
            <code className="mt-3 block break-all rounded-md border border-dashed border-border-strong bg-surface-2 p-3 font-mono text-[0.85rem] text-accent">
              {generatedLink}
            </code>
          </>
        ) : (
          <form onSubmit={onSubmit} className="stack">
            <Field>
              <Label htmlFor="company">Société</Label>
              <Input name="company" id="company" required placeholder="Ex : Café Bricoli" />
            </Field>
            <Field>
              <Label htmlFor="contactName">Nom du contact</Label>
              <Input name="contactName" id="contactName" required placeholder="Ex : Hamza Cherkaoui" />
            </Field>
            <Field>
              <Label htmlFor="email">Email professionnel</Label>
              <Input name="email" id="email" type="email" required placeholder="achats@societe.ma" />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" disabled={submitting} block>
              <Mail className="h-4 w-4" />
              {submitting ? "Création…" : "Générer le lien d'invitation"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
