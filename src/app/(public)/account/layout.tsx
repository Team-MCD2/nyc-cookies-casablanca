import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Container } from "@/components/ui/misc";
import { LogIn } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentSession, getCustomerForUser, roleHome } from "@/lib/auth";
import { AccountTabs } from "./account-tabs";

/**
 * Wrapper for /account/*. Enforces sign-in, redirects admins/pros back to
 * their own spaces, and renders a small identity strip + tab nav.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return (
      <Container className="py-16 md:py-24">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] tracking-[0.04em]">
            Connexion requise
          </h1>
          <p className="mt-2 text-text-3">
            Connecte-toi pour accéder à ton espace personnel, ton historique de
            commandes et tes préférences.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/login?redirect_url=/account">
              <Button>
                <LogIn className="h-4 w-4" /> Se connecter
              </Button>
            </Link>
            <Link href="/signup?redirect_url=/account">
              <Button variant="outline">Créer un compte</Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // Admins / pros bounce back to their proper space — they shouldn't manage
  // their account from /account (their own consoles already do that).
  if (session.role !== "b2c") {
    redirect(roleHome(session.role));
  }

  const user = await currentUser();
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Cookie lover";

  // The customers row may be a millisecond behind ensureCustomerRow() on the
  // very first sign-in. We tolerate its absence — the dashboard pages handle it.
  const customer = await getCustomerForUser(session.userId);

  return (
    <Container className="py-10 md:py-12 print:p-0 print:m-0 print:w-full">
      {/* Identity strip */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="lg" />
          <div className="min-w-0">
            <div className="text-[0.78rem] uppercase tracking-[0.18em] text-accent">
              Mon compte
            </div>
            <h1 className="mt-1 font-display text-[clamp(1.6rem,2.6vw,2rem)] tracking-[0.04em]">
              Bonjour, {displayName.split(" ")[0]}
            </h1>
            <div className="mt-0.5 text-[0.85rem] text-text-3">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
              {customer?.created_at && (
                <>
                  {" · "}membre depuis {new Date(customer.created_at).getFullYear()}
                </>
              )}
            </div>
          </div>
        </div>
        <Link href="/shop">
          <Button>Continuer mes courses</Button>
        </Link>
      </div>

      {/* Tab nav */}
      <div className="print:hidden">
        <AccountTabs />
      </div>

      {/* Page content */}
      <div className="mt-6 print:m-0 print:p-0">{children}</div>
    </Container>
  );
}
