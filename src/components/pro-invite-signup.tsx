"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { Field, Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProInviteSignupProps {
  token: string;
  company: string;
  contactName: string;
  email: string;
}

/**
 * Two-step signup for pro invitations:
 * 1. Ask for ICE number (optional but encouraged)
 * 2. Show Clerk SignUp with ICE stored in unsafeMetadata
 */
export function ProInviteSignup({ token, company, contactName, email }: ProInviteSignupProps) {
  const [step, setStep] = useState<"ice" | "signup">("ice");
  const [ice, setIce] = useState("");

  if (step === "ice") {
    return (
      <div className="space-y-5">
        <Field>
          <Label htmlFor="ice-input">Numéro ICE (Identifiant Commun de l'Entreprise)</Label>
          <Input
            id="ice-input"
            type="text"
            placeholder="Ex: 003386290000042"
            value={ice}
            onChange={(e) => setIce(e.target.value)}
            className="font-mono"
          />
          <p className="mt-1 text-[0.8rem] text-text-3">
            Ce numéro apparaîtra sur vos factures. Vous pourrez le modifier plus tard.
          </p>
        </Field>
        <Button block onClick={() => setStep("signup")}>
          Continuer l'inscription
        </Button>
      </div>
    );
  }

  return (
    <SignUp
      unsafeMetadata={{
        invitationToken: token,
        company,
        contactName,
        ice: ice.trim() || undefined,
      }}
      initialValues={{ emailAddress: email }}
      appearance={{
        elements: { rootBox: "w-full", card: "bg-transparent shadow-none" },
      }}
    />
  );
}
