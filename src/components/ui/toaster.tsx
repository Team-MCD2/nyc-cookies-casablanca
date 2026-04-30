"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* =========================================================================
   Custom toaster — module-level pubsub (no external lib).
   Usage:
     1. Mount <Toaster /> once at the root layout.
     2. Call toast({ title, message, type }) from anywhere.
   ========================================================================= */

type ToastType = "default" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  timeout?: number;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l(toasts);
}

export function toast(input: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2, 9);
  const t: Toast = { id, type: "default", timeout: 3200, ...input };
  toasts = [...toasts, t];
  notify();
  if (t.timeout && t.timeout > 0) {
    setTimeout(() => dismiss(id), t.timeout);
  }
  return id;
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

const typeBorder: Record<ToastType, string> = {
  default: "border-l-accent",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
};

/** Mounts the toast region. Place once near the root of <body>. */
export function Toaster() {
  const [list, setList] = React.useState<Toast[]>(toasts);
  React.useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2"
    >
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto min-w-[260px] max-w-[360px]",
            "animate-slide-in-right rounded-md border border-border-strong border-l-4 bg-surface-2",
            "px-4 py-3 shadow-elev-md",
            typeBorder[t.type ?? "default"],
          )}
        >
          <div className="text-[0.92rem] font-semibold">{t.title}</div>
          {t.message && <div className="mt-0.5 text-[0.85rem] text-text-3">{t.message}</div>}
        </div>
      ))}
    </div>
  );
}
