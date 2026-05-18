"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Cookie,
  Package,
  Users,
  Briefcase,
  FileText,
  PlusCircle,
  ShieldCheck,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { ADMIN_NAV, PRO_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  cookie: Cookie,
  package: Package,
  users: Users,
  briefcase: Briefcase,
  "file-text": FileText,
  "plus-circle": PlusCircle,
  "shield-check": ShieldCheck,
};

interface AppShellProps {
  role: "admin" | "pro";
  brandRole: string;
  topbarTitle: string;
  topbarActions?: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

export function AppShell({ role, brandRole, topbarTitle, topbarActions, user, children }: AppShellProps) {
  const pathname = usePathname();
  const sections = role === "admin" ? ADMIN_NAV : PRO_NAV;
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--sidebar-w)_1fr] print:block print:w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[280px] max-w-[86vw] flex-col overflow-y-auto",
          "border-r border-border bg-surface shadow-elev-lg transition-transform duration-base",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 lg:shadow-none",
          "print:hidden",
        )}
      >
        {/* Brand */}
        <Link
          href={role === "admin" ? "/admin/dashboard" : "/pro/dashboard"}
          className="flex items-center gap-3 border-b border-border px-5 py-5"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/nyclogo.png"
            alt="NYC Cookies"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <div className="font-display text-[1.1rem] leading-none tracking-[0.06em]">
              NYC Cookies
            </div>
            <div className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-accent">
              {brandRole}
            </div>
          </div>
        </Link>

        {/* Nav sections */}
        <div className="flex-1 px-3 py-4">
          {sections.map((s) => (
            <div key={s.label} className="mb-3">
              <div className="px-3 pb-2 text-[0.7rem] uppercase tracking-[0.18em] text-text-muted">
                {s.label}
              </div>
              <div className="space-y-1">
                {s.links.map((l) => {
                  const Icon = ICON_MAP[l.icon] ?? LayoutDashboard;
                  const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-3 text-[0.92rem] font-medium transition-colors duration-fast",
                        isActive
                          ? "bg-accent-soft text-text shadow-[inset_3px_0_0_theme(colors.accent.DEFAULT)]"
                          : "text-text-2 hover:bg-surface-2 hover:text-text",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {l.text}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer (logout) */}
        <div className="border-t border-border p-4">
          <SignOutButton>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2.5 text-[0.92rem] font-semibold text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        {/* Topbar */}
        <div className="app-topbar flex items-center justify-between px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="font-display text-[1.4rem] tracking-[0.04em]">{topbarTitle}</div>
          </div>
          <div className="flex items-center gap-3">
            {topbarActions}
            <UserMenu
              user={{ name: user.name ?? null, email: user.email ?? null, role }}
              spaceHref={role === "admin" ? "/admin/dashboard" : "/pro/dashboard"}
              spaceLabel={role === "admin" ? "Console Admin" : "Espace Pro"}
            />
          </div>
        </div>

        {/* Page */}
        <main className="p-4 sm:p-6 print:p-0 print:m-0 print:w-full">{children}</main>
      </div>
    </div>
  );
}
