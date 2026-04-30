"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

/**
 * Custom modal — pure Tailwind, no Radix/HeadlessUI.
 * - Closes on Escape and on backdrop click.
 * - Locks body scroll while open.
 */
export function Modal({ open, onClose, title, footer, children, size = "md" }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full animate-slide-up flex-col overflow-hidden",
          "rounded-xl border border-border bg-surface shadow-elev-lg",
          sizeMap[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="font-display text-[1.25rem] uppercase tracking-[0.04em]">{title}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
