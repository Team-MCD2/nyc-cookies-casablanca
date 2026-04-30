"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  exact?: boolean;
}

const TABS: Tab[] = [
  { href: "/account", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Mes commandes", icon: Package },
  { href: "/account/profile", label: "Profil & sécurité", icon: UserCog },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections du compte"
      className="-mb-px flex flex-wrap gap-1 border-b border-border"
    >
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-[0.9rem] font-medium transition-colors",
              active
                ? "border-accent text-text"
                : "border-transparent text-text-3 hover:border-border-strong hover:text-text",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
