import * as React from "react";
import { cn, initials } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-[30px] w-[30px] text-[0.85rem]",
  md: "h-[38px] w-[38px] text-base",
  lg: "h-14 w-14 text-[1.4rem]",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  size?: Size;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, size = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-full",
        "border border-border bg-accent-soft font-display tracking-[0.04em] text-accent",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children ?? initials(name)}
    </div>
  ),
);
Avatar.displayName = "Avatar";
