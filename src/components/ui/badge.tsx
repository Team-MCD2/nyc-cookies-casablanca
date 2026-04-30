import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const variantClasses: Record<Variant, string> = {
  success: "text-success bg-success-soft border-success/30",
  warning: "text-warning bg-warning-soft border-warning/30",
  danger: "text-danger bg-danger-soft border-danger/30",
  info: "text-info bg-info-soft border-info/30",
  neutral: "text-text-2 bg-surface-3 border-border",
  accent: "text-accent bg-accent-soft border-accent/30",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  dot = true,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[0.72rem] font-semibold uppercase tracking-[0.08em]",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
