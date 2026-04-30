import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { SITE } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Side panel (desktop only) */}
      <aside
        className="relative hidden flex-col justify-between border-r border-border p-12 lg:flex"
        style={{
          background: `
            linear-gradient(160deg, rgba(213,74,42,0.18), transparent 60%),
            radial-gradient(circle at 30% 30%, #1a1a1a, #050505 80%)
          `,
        }}
      >
        <Link href="/" className="flex items-center gap-3">
          <Image src="/nyclogo.png" alt={SITE.fullName} width={56} height={56} className="h-14 w-14 rounded-full" />
          <div>
            <div className="font-display text-[1.4rem] tracking-[0.06em]">{SITE.name}</div>
            <div className="mt-1 text-[0.74rem] uppercase tracking-[0.22em] text-accent">{SITE.city}</div>
          </div>
        </Link>

        <div className="stack-lg">
          <div className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[0.02em]">
            Le goût du <span className="text-accent">bonheur,</span>
            <br />
            cuit chaque matin.
          </div>
          <ul className="stack-sm text-text-2">
            {[
              "Suivi de vos commandes",
              "Offres réservées aux membres",
              "Commande en 1 clic",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-[0.85rem] text-text-3">
          &copy; {new Date().getFullYear()} {SITE.fullName} — {SITE.address.street}, {SITE.address.city}
        </div>
      </aside>

      {/* Form area */}
      <main className="flex items-center justify-center px-6 py-8">{children}</main>
    </div>
  );
}
