"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "admin" | "pro" | "b2c";

interface UserMenuProps {
  user: {
    name: string | null;
    email: string | null;
    role: Role;
  };
  spaceHref: string;
  spaceLabel: string;
}

const ROLE_META: Record<Role, { label: string; variant: "danger" | "accent" | "info" }> = {
  admin: { label: "Admin", variant: "danger" },
  pro:   { label: "Pro",   variant: "accent" },
  b2c:   { label: "Client", variant: "info"  },
};

export function UserMenu({ user, spaceHref, spaceLabel }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Compte";
  const meta = ROLE_META[user.role];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3 transition-colors hover:bg-surface-3 hover:border-border-strong"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName} size="sm" />
        <span className="hidden text-[0.85rem] font-medium text-text-2 sm:inline max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        >
          {/* Identity card */}
          <div className="border-b border-border bg-surface-2 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={displayName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-text">{displayName}</div>
                <div className="truncate text-[0.78rem] text-text-3">
                  {user.email ?? "—"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <span className="text-[0.7rem] uppercase tracking-[0.1em] text-text-3">
                Connecté
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <Link
              href={spaceHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-[0.9rem] text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            >
              <UserIcon className="h-4 w-4" /> {spaceLabel}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut(() => {
                  window.location.href = "/";
                });
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[0.9rem] text-text-2 transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
