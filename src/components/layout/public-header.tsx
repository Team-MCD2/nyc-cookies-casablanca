"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, Menu, X, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV, SITE } from "@/lib/site";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

interface PublicHeaderProps {
  /** Authenticated user (null when signed out). */
  user?: {
    name: string | null;
    email: string | null;
    role: Role;
  } | null;
  /** Where the "Mon espace" button leads (depends on role). */
  spaceHref?: string;
  spaceLabel?: string;
}

export function PublicHeader({
  user = null,
  spaceHref = "/login",
  spaceLabel = "Connexion",
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="public-header sticky top-0 z-50 glass-morphism border-none print:hidden">
      <div className="container flex items-center justify-between py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/nyclogo.png"
            alt={SITE.fullName}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full"
            priority
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {PUBLIC_NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="text-[0.92rem] font-medium text-text-2 transition-colors duration-fast hover:text-accent"
            >
              {i.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} spaceHref={spaceHref} spaceLabel={spaceLabel} />
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4" /> Connexion
                </Button>
              </Link>
              <Link href="/devenir-pro">
                <Button variant="ghost" size="sm">
                  <UserPlus className="h-4 w-4" /> Devenir pro
                </Button>
              </Link>
            </div>
          )}
          <Link href={user ? spaceHref : "/login"}>
            <Button variant="primary" size="sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Espace Pro</span>
            </Button>
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div
        className={cn(
          "absolute inset-x-0 top-full flex flex-col gap-3 border-b border-border bg-surface px-5 py-5 md:hidden",
          open ? "flex" : "hidden",
        )}
      >
        <p className="text-[0.7rem] font-display uppercase tracking-[0.18em] text-text-muted">
          Menu
        </p>
        {PUBLIC_NAV.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => setOpen(false)}
            className="text-[0.95rem] text-text-2 hover:text-accent"
          >
            {i.label}
          </Link>
        ))}
        <Link
          href={user ? spaceHref : "/login"}
          onClick={() => setOpen(false)}
          className="border-t border-border pt-3 text-[0.95rem] font-medium text-accent hover:text-accent-hover"
        >
          Espace Pro
        </Link>
        {!user && (
          <div className="flex flex-col gap-2 sm:hidden">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-[0.95rem] text-text-2 hover:text-accent"
            >
              Connexion
            </Link>
            <Link
              href="/devenir-pro"
              onClick={() => setOpen(false)}
              className="text-[0.95rem] text-text-2 hover:text-accent"
            >
              Devenir client pro
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
