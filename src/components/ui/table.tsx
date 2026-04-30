import * as React from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>{children}</div>
  );
}

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("min-w-[640px] w-full border-collapse", className)}
      {...props}
    />
  ),
);
Table.displayName = "Table";

export const Thead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />);
Thead.displayName = "Thead";

export const Tr = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors duration-fast last:border-b-0",
      "hover:[&:where([data-tbody]_&)]:bg-surface-2",
      className,
    )}
    {...props}
  />
));
Tr.displayName = "Tr";

export const Th = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "border-b border-border bg-surface-2 px-4 py-4 text-left",
      "text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-3",
      className,
    )}
    {...props}
  />
));
Th.displayName = "Th";

export const Td = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-4 align-middle", className)} {...props} />
));
Td.displayName = "Td";

export function Tbody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody data-tbody {...props}>
      {children}
    </tbody>
  );
}
