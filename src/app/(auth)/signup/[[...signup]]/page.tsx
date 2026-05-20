import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export default function SignupPage() {
  return (
    <div className="w-full max-w-[440px] text-center md:text-left">
      <h1 className="font-display text-[2rem] tracking-[0.04em] text-text">Espace Professionnel</h1>
      <p className="mt-2 text-text-3 leading-relaxed">
        L'accès à notre plateforme **NYC Cookies Casablanca** est exclusivement réservé aux clients professionnels (B2B). 
        Les inscriptions se font uniquement sur invitation par notre équipe.
      </p>

      <div className="mt-8 p-6 rounded-2xl bg-bg-2 border border-border/50 text-left stack-sm">
        <h3 className="font-medium text-text text-[1rem]">Comment obtenir un compte Pro ?</h3>
        <p className="text-[0.9rem] text-text-3">
          Contactez-nous pour soumettre votre demande d'ouverture de compte. Notre équipe vous transmettra un lien d'activation unique par e-mail ou WhatsApp.
        </p>

        <div className="mt-4 pt-4 border-t border-border/50 stack-xs">
          <a href={`tel:${SITE.phone}`} className="flex items-center gap-3 text-[0.9rem] text-text hover:text-primary transition-colors">
            <Phone className="h-4 w-4 text-text-3" />
            <span>{SITE.phone}</span>
          </a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-[0.9rem] text-text hover:text-primary transition-colors">
            <Mail className="h-4 w-4 text-text-3" />
            <span>{SITE.email}</span>
          </a>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/devenir-pro" className="w-full">
          <Button block className="h-12 text-sm font-bold uppercase tracking-wider">Déposer une demande de compte</Button>
        </Link>
        <Link href="/login" className="w-full">
          <Button block variant="outline" className="h-12">Se connecter à un compte existant</Button>
        </Link>
      </div>
    </div>
  );
}

