import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getCurrentSession, roleHome } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect(roleHome(session.role));

  return (
    <div className="w-full max-w-[440px]">
      <h1 className="font-display text-[2rem] tracking-[0.04em]">Bon retour</h1>
      <p className="mt-1 text-text-3">
        Connexion réservée aux clients professionnels et à l&apos;équipe admin.
      </p>
      <div className="mt-6">
        <SignIn
          forceRedirectUrl="/after-sign-in"
          fallbackRedirectUrl="/after-sign-in"
          appearance={{ elements: { rootBox: "w-full", card: "bg-transparent shadow-none" } }}
        />
      </div>
    </div>
  );
}
