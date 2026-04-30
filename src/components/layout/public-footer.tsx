import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MessageCircle, ArrowUpRight } from "lucide-react";
import { SITE, PUBLIC_NAV, SHOP_LINKS } from "@/lib/site";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-[#050505] text-text-2">
      {/* Top */}
      <div className="container grid gap-8 py-12 md:grid-cols-[2.2fr_1fr_1.3fr_1fr] md:gap-10">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/nyclogo.png"
              alt={SITE.fullName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full"
            />
            <div>
              <div className="font-display text-[1.15rem] uppercase leading-none tracking-[0.06em]">
                {SITE.name}
              </div>
              <div className="mt-0.5 text-[0.7rem] uppercase tracking-[0.2em] text-accent">
                {SITE.city}
              </div>
            </div>
          </Link>
          <p className="mt-3 max-w-[320px] text-[0.9rem] leading-[1.55] text-text-3">
            {SITE.description}
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { href: SITE.social.instagram, label: "Instagram", Icon: Instagram },
              { href: SITE.social.facebook, label: "Facebook", Icon: Facebook },
              { href: SITE.social.whatsapp, label: "WhatsApp", Icon: MessageCircle },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-text-2 transition-[background-color,border-color,color,transform] duration-fast hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="mb-4 font-display text-[0.95rem] uppercase tracking-[0.18em] text-accent">
            Navigation
          </h4>
          <ul className="space-y-1">
            {PUBLIC_NAV.map((i) => (
              <li key={i.href} className="py-1">
                <Link href={i.href} className="text-[0.92rem] text-text-2 hover:text-accent">
                  {i.label}
                </Link>
              </li>
            ))}
            <li className="py-1">
              <Link href="/mentions-legales" className="text-[0.92rem] text-text-2 hover:text-accent">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>

        {/* Boutique + Contact */}
        <div>
          <h4 className="mb-4 font-display text-[0.95rem] uppercase tracking-[0.18em] text-accent">
            La boutique
          </h4>
          <ul className="space-y-1">
            {SHOP_LINKS.map((i) => (
              <li key={i.href} className="py-1">
                <Link href={i.href} className="text-[0.92rem] text-text-2 hover:text-accent">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="mb-4 mt-5 font-display text-[0.95rem] uppercase tracking-[0.18em] text-accent">
            Contact
          </h4>
          <address className="not-italic text-[0.92rem] leading-[1.7] text-text-2">
            {SITE.address.street},<br />
            {SITE.address.complement},<br />
            {SITE.address.city}, {SITE.address.country}
            <br />
            <a href={`tel:${SITE.phone}`} className="hover:text-accent">
              {SITE.phoneDisplay}
            </a>
            <br />
            <a href={`mailto:${SITE.email}`} className="hover:text-accent">
              {SITE.email}
            </a>
          </address>
        </div>

        {/* Horaires */}
        <div>
          <h4 className="mb-4 font-display text-[0.95rem] uppercase tracking-[0.18em] text-accent">
            Horaires
          </h4>
          <ul className="space-y-2">
            {SITE.openingHours.map((h) => (
              <li key={h.days} className="flex flex-col">
                <span className="text-[0.88rem] font-medium text-text">{h.days}</span>
                <span className="text-[0.85rem] text-text-muted">{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-[0.8rem] text-text-muted md:flex-row">
          <p>
            &copy; {year} {SITE.fullName} — Tous droits réservés.
          </p>
          <p className="flex flex-wrap gap-5">
            <Link href="/mentions-legales" className="hover:text-accent">
              Mentions légales
            </Link>
            <Link href="/mentions-legales#confidentialite" className="hover:text-accent">
              Confidentialité
            </Link>
            <Link href="/mentions-legales#cookies" className="hover:text-accent">
              Cookies
            </Link>
          </p>
        </div>
      </div>

      {/* Agency */}
      <div className="bg-black/60">
        <div className="container flex items-center justify-center gap-2 py-3 text-[0.78rem] text-text-muted">
          <span>Développé par</span>
          <a
            href="https://microdidact.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 font-display uppercase tracking-[0.22em] text-accent transition-colors hover:text-accent-hover"
            aria-label="Microdidact - Agence de communication"
          >
            Microdidact
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
