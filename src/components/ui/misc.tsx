import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title?: React.ReactNode;
}

/** Dashed empty-state card (mirrors prototype's `.empty`). */
export function Empty({ icon, title, children, className, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-text-3",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-muted">
          {icon}
        </div>
      )}
      {title && <div className="font-display text-base uppercase tracking-[0.04em] text-text">{title}</div>}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

/** Small uppercase eyebrow tag (matches prototype's `.eyebrow`). */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("eyebrow", className)} {...props} />;
}

/** Page header (title left, actions right). */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-2"><Eyebrow>{eyebrow}</Eyebrow></div>}
        <h1 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] tracking-[0.04em]">{title}</h1>
        {subtitle && <p className="mt-1 text-text-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Container with prototype's max-width + responsive padding. */
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("container", className)} {...props} />;
}
