import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose Tailwind classes safely (resolves duplicates / conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer in MAD (Moroccan Dirham), French locale. */
export function money(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " MAD";
}

/** Format a date-like value in fr-FR short form. */
export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Get initials (max 2 chars) from a person/company name. */
export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Slugify a string for IDs/anchors. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a short random id with prefix. */
export function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
