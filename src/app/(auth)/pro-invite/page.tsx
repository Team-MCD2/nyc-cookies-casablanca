import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/misc";
import { findInvitation } from "@/lib/queries";
import { SignUp } from "@clerk/nextjs";
import { SITE } from "@/lib/site";

interface ProInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ProInvitePage({ searchParams }: ProInvitePageProps) {
  const { token } = await searchParams;
  const inv = token ? await findInvitation(token).catch(() => null) : null;

  if (!token || !inv) {
    return (
      <div className="w-full max-w-[440px]">
        <h1 className="font-display text-[2rem] tracking-[0.04em]">Lien invalide</h1>
        <p className="mt-1 text-text-3">
          Ce lien d'invitation n'est pas valide ou a expiré.
        </p>
        <div className="mt-6 stack-sm">
          <Link href="/login">
            <Button block>Aller à la connexion</Button>
          </Link>
          <a href={`mailto:${SITE.email}`}>
            <Button block variant="outline">
              <Mail className="h-4 w-4" /> Demander un nouveau lien
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (inv.used) {
    return (
      <div className="w-full max-w-[440px]">
        <Empty title="Invitation déjà utilisée">
          Cette invitation a déjà été utilisée. Veuillez vous connecter.
        </Empty>
        <div className="mt-6">
          <Link href="/login">
            <Button block>Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px]">
      <h1 className="font-display text-[2rem] tracking-[0.04em]">Bienvenue</h1>
      <p className="mt-1 text-text-3">
        Activez votre compte pour <strong className="text-text">{inv.company}</strong>.
      </p>
      <div className="mt-6">
        <SignUp
          unsafeMetadata={{
            invitationToken: inv.token,
            company: inv.company,
            contactName: inv.contactName,
          }}
          initialValues={{ emailAddress: inv.email }}
          appearance={{ elements: { rootBox: "w-full", card: "bg-transparent shadow-none" } }}
        />
      </div>
      <p className="mt-5 text-center text-[0.85rem] text-text-3">
        Une fois inscrit, contactez-nous pour finaliser le passage en compte pro.
      </p>
    </div>
  );
}
