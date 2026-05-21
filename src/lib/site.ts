/**
 * NYC Cookies — Brand & navigation data (single source of truth).
 * Used by Header, Footer, legal page, JSON-LD, etc.
 */

export const SITE = {
  name: "NYC Cookies",
  fullName: "NYC Cookies Casablanca",
  tagline: "Best cookies in town · Casablanca",
  city: "Casablanca · Since 2022",
  description:
    "Cookies new-yorkais artisanaux, fraîchement cuits à Casablanca. La taste of happiness, version Casa.",
  url: "https://nyc-cookies.ma",
  locale: "fr-MA",
  lang: "fr",
  phone: process.env.NEXT_PUBLIC_BRAND_PHONE ?? "+212670622380",
  phoneDisplay: "+212 670 622 380",
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL ?? "nyccookies.casa@gmail.com",
  address: {
    street: "7 Rue Jounaïd",
    complement: "résidence les Princesses",
    city: "Casablanca",
    country: "Maroc",
  },
  openingHours: [
    { days: "Lundi – Samedi", hours: "10h00 – 22h00" },
    { days: "Dimanche", hours: "14h00 – 22h00" },
  ],
  social: {
    instagram: "https://www.instagram.com/nyc_cookies_casa/",
    facebook: "https://www.facebook.com/nyccookies.ma/",
    whatsapp: "https://wa.me/212670622380",
  },
} as const;

export const PUBLIC_NAV = [
  { href: "/#products", label: "Cookies" },
  { href: "/#story", label: "Notre histoire" },
  { href: "/pro", label: "Espace Pros" },
  { href: "/shop", label: "Boutique" },
] as const;

export const SHOP_LINKS = [
  { href: "/shop", label: "Tous les cookies" },
  { href: "/shop?cat=box", label: "Boxes" },
  { href: "/shop?cat=icecream", label: "Cookie Ice Cream" },
] as const;

export const ADMIN_NAV = [
  {
    label: "Pilotage",
    links: [{ href: "/admin/dashboard", icon: "layout-dashboard", text: "Dashboard" }],
  },
  {
    label: "Boutique",
    links: [
      { href: "/admin/products", icon: "cookie", text: "Produits" },
      { href: "/admin/orders", icon: "package", text: "Commandes" },
    ],
  },
  {
    label: "Clientèle",
    links: [
      { href: "/admin/customers", icon: "users", text: "Clients B2C" },
      { href: "/admin/pros", icon: "briefcase", text: "Clients Pros" },
      { href: "/admin/invoices", icon: "file-text", text: "Factures" },
    ],
  },
  {
    label: "Système",
    links: [
      { href: "/admin/users", icon: "shield-check", text: "Utilisateurs" },
      { href: "/admin/whatsapp", icon: "layout-dashboard", text: "WhatsApp Bot" },
    ],
  },
] as const;

export const PRO_NAV = [
  {
    label: "Mon espace",
    links: [{ href: "/pro/dashboard", icon: "layout-dashboard", text: "Dashboard" }],
  },
  {
    label: "Commandes",
    links: [
      { href: "/pro/order", icon: "plus-circle", text: "Nouvelle commande" },
      { href: "/pro/orders", icon: "package", text: "Mes commandes" },
    ],
  },
  {
    label: "Facturation",
    links: [{ href: "/pro/invoices", icon: "file-text", text: "Mes factures" }],
  },
] as const;
