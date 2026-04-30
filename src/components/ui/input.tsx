import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------- Field wrapper ---------- */
export const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
));
Field.displayName = "Field";

/* ---------- Label ---------- */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-[0.85rem] font-medium text-text-2", className)}
    {...props}
  />
));
Label.displayName = "Label";

/* ---------- Help & error texts ---------- */
export function FieldHelp(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn("text-[0.78rem] text-text-muted", props.className)} />;
}
export function FieldError(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p role="alert" {...props} className={cn("text-[0.8rem] text-danger", props.className)} />;
}

/* ---------- Input ---------- */
const baseField =
  "w-full rounded-md border border-border bg-surface-2 px-[0.9rem] py-2.5 text-text " +
  "placeholder:text-text-muted transition-[border-color,background-color] duration-fast " +
  "focus:border-accent focus:bg-surface-3 focus:outline-none";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, className)} {...props} />
  ),
);
Input.displayName = "Input";

/* ---------- Input with leading icon ---------- */
interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}
export const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-[0.85rem] flex h-4 w-4 items-center justify-center text-text-muted">
        {icon}
      </span>
      <input ref={ref} className={cn(baseField, "pl-[2.4rem]", className)} {...props} />
    </div>
  ),
);
InputGroup.displayName = "InputGroup";

/* ---------- Select ---------- */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "appearance-none", className)} {...props} />
));
Select.displayName = "Select";

/* ---------- Textarea ---------- */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(baseField, "min-h-[110px] resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ---------- Checkbox (label wrapper) ---------- */
export function Checkbox({
  className,
  children,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { children?: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 text-[0.9rem] text-text-2",
        className,
      )}
    >
      <input type="checkbox" className="h-4 w-4 accent-accent" {...props} />
      {children}
    </label>
  );
}
