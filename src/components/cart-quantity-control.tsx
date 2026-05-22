"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartQuantityControlProps {
  value: number;
  onChange: (qty: number) => void;
  /** Plafond stock (optionnel). */
  max?: number;
  className?: string;
}

export function CartQuantityControl({
  value,
  onChange,
  max,
  className,
}: CartQuantityControlProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function clamp(q: number) {
    let n = Math.max(0, Math.floor(q));
    if (max != null && max > 0) n = Math.min(n, max);
    return n;
  }

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") {
      onChange(0);
      setDraft("0");
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const q = clamp(parsed);
    onChange(q);
    setDraft(String(q));
  }

  function step(delta: number) {
    const next = clamp(value + delta);
    onChange(next);
    setDraft(String(next));
  }

  const atMax = max != null && max > 0 && value >= max;

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-md border border-border-strong",
        className,
      )}
    >
      <button
        type="button"
        className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text disabled:opacity-40"
        onClick={() => step(-1)}
        disabled={value <= 0}
        aria-label="Diminuer la quantité"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={focused ? draft : String(value)}
        onFocus={(e) => {
          setFocused(true);
          setDraft(String(value));
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-14 min-w-[3.5rem] border-x border-border-strong bg-surface py-1.5 text-center text-[0.9rem] tabular-nums text-text focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="Quantité"
      />
      <button
        type="button"
        className="bg-surface-2 px-2.5 py-1.5 text-text-2 hover:bg-surface-3 hover:text-text disabled:opacity-40"
        onClick={() => step(1)}
        disabled={atMax}
        aria-label="Augmenter la quantité"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
