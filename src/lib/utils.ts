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

/** Resolve product image URL based on name/category. */
export function getProductImage(p: { name: string; category?: string; imageUrl?: string | null }) {
  if (p.imageUrl) return p.imageUrl;
  const n = (p.name ?? "").toLowerCase();
  const c = (p.category ?? "").toLowerCase();
  
  // Static high-quality local images first
  if (n.includes("soho")) return "/images/cookies/soho.png";
  if (n.includes("pink") || n.includes("velvet")) return "/images/cookies/pink-velvet.png";
  if (n.includes("bronx")) return "/images/cookies/bronx.png";
  if (n.includes("central park")) return "/images/cookies/central-park.png";
  if (n.includes("times square")) return "/images/cookies/times-square.png";
  if (n.includes("brooklyn")) return "/images/cookies/bronx.png";
  if (n.includes("harlem")) return "/images/cookies/pink-velvet.png";
  if (n.includes("staten")) return "/images/cookies/times-square.png";
  if (n.includes("little italy")) return "/images/cookies/soho.png";
  if (n.includes("madison square")) return "/images/cookies/central-park.png";
  if (n.includes("rikers")) return "/images/cookies/bronx.png";
  if (n.includes("wall street")) return "/images/cookies/central-park.png";
  if (n.includes("mini cookie")) return "/images/cookies/pink-velvet.png";
  if (n.includes("grand cookie")) return "/images/hero.png";
  
  // Categories and generic fallbacks
  if (c === "box") return "/images/hero.png";
  if (c === "icecream") return "/images/cookies/pink-velvet.png";

  // Default fallback to hero stack
  return "/images/hero.png";
}
