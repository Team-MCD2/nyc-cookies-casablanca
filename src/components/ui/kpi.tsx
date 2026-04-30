import * as React from "react";
import { cn } from "@/lib/utils";

/** KPI card — mirrors prototype's `.kpi` with radial accent corner. */
interface KpiProps {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "up" | "down";
  className?: string;
}

export function Kpi({ label, value, delta, deltaTone, className }: KpiProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-surface p-6",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(213,74,42,0.12), transparent)",
        }}
      />
      <div className="text-[0.78rem] uppercase tracking-[0.16em] text-text-3">{label}</div>
      <div className="mt-2 font-display text-[2.2rem] leading-none tracking-[0.02em]">{value}</div>
      {delta && (
        <div
          className={cn(
            "mt-2 text-[0.82rem]",
            deltaTone === "up" && "text-success",
            deltaTone === "down" && "text-danger",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
