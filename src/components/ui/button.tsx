import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white border-transparent hover:bg-accent-hover hover:shadow-elev-md",
  secondary:
    "bg-surface-2 text-text border-border-strong hover:bg-surface-3 hover:border-text-muted",
  ghost: "text-text-2 border-transparent hover:bg-surface-2 hover:text-text",
  outline:
    "border-border-strong text-text hover:border-accent hover:text-accent",
  danger: "bg-danger text-white border-transparent hover:brightness-110",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[0.82rem] rounded-sm",
  md: "px-[1.1rem] py-2.5 text-[0.92rem] rounded-md",
  lg: "px-6 py-[0.95rem] text-base rounded-lg",
  icon: "p-2.5 aspect-square rounded-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", block = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap border font-semibold",
        "transition-[transform,background-color,border-color,box-shadow] duration-fast",
        "hover:-translate-y-0.5 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
