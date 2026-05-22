import type { ProductCategory } from "@/lib/types";

/** Entrée catalogue officiel NYC Cookies Casablanca (modifiable via /admin/products). */
export type CatalogEntry = {
  id: string;
  name: string;
  collection: string;
  tagline?: string;
  desc: string;
  category: ProductCategory;
  price: number;
  stock: number;
};

const iconiques = "Les Iconiques";
const audacieux = "Les Audacieux";
const elite = "Les Élite";
const gourmets = "Les Gourmets";
const formats = "Formats partenaire";

function desc(collection: string, description: string) {
  return `${collection} — ${description}`;
}

/** 12 cookies signature + 2 formats (mini / grand). Aucune glace. */
export const NYC_COOKIE_CATALOG: CatalogEntry[] = [
  {
    id: "p_brooklyn",
    name: "Brooklyn",
    collection: iconiques,
    tagline: "Taste the legend, feel the city",
    desc: desc(iconiques, "100% chocolat et brownie — intense, fondant, pur cacao."),
    category: "cookie",
    price: 25,
    stock: 42,
  },
  {
    id: "p_harlem",
    name: "Harlem",
    collection: iconiques,
    desc: desc(iconiques, "Chocolat & noix, fondant et croquant."),
    category: "cookie",
    price: 25,
    stock: 37,
  },
  {
    id: "p_times_square",
    name: "Times Square",
    collection: iconiques,
    desc: desc(iconiques, "Cœur chocolat intense, nutella."),
    category: "cookie",
    price: 25,
    stock: 55,
  },
  {
    id: "p_rikers",
    name: "Rikers Island",
    collection: audacieux,
    tagline: "A taste of luxury, a bold statement in every bite",
    desc: desc(audacieux, "Crème spéculoos, cœur chocolat blanc, lotus."),
    category: "cookie",
    price: 28,
    stock: 29,
  },
  {
    id: "p_bronx",
    name: "Bronx",
    collection: audacieux,
    desc: desc(audacieux, "Cœur Milka caramel, chocolat caramel."),
    category: "cookie",
    price: 28,
    stock: 33,
  },
  {
    id: "p_staten_island",
    name: "Staten Island",
    collection: audacieux,
    desc: desc(audacieux, "Cœur pépites de chocolat, chocolat blanc Kinder Maxi."),
    category: "cookie",
    price: 28,
    stock: 18,
  },
  {
    id: "p_soho",
    name: "Soho",
    collection: elite,
    tagline: "Experience the vibrant freshness of NYC Cookies",
    desc: desc(elite, "Crème Kunafa citron, zeste de citron vert et framboise."),
    category: "cookie",
    price: 32,
    stock: 22,
  },
  {
    id: "p_little_italy",
    name: "Little Italy",
    collection: elite,
    desc: desc(elite, "Tiramisu, cœur mascarpone, touche cacao."),
    category: "cookie",
    price: 32,
    stock: 15,
  },
  {
    id: "p_central_park",
    name: "Central Park",
    collection: elite,
    desc: desc(elite, "Cœur pomme, cannelle et caramel."),
    category: "cookie",
    price: 32,
    stock: 27,
  },
  {
    id: "p_pink_velvet",
    name: "Pink Velvet",
    collection: gourmets,
    tagline: "Exquisite and refined, a true delicacy of the city",
    desc: desc(
      gourmets,
      "Red velvet, cœur crème cheese, chocolat blanc et framboise.",
    ),
    category: "cookie",
    price: 35,
    stock: 12,
  },
  {
    id: "p_wall_street",
    name: "Wall Street",
    collection: gourmets,
    desc: desc(gourmets, "Cœur crème Bueno, chocolat Kinder Bueno."),
    category: "cookie",
    price: 35,
    stock: 19,
  },
  {
    id: "p_madison_square",
    name: "Madison Square",
    collection: gourmets,
    desc: desc(gourmets, "Cœur crème pistache, framboise et éclats de pistache."),
    category: "cookie",
    price: 35,
    stock: 8,
  },
  {
    id: "p_grand_cookie",
    name: "Grand Cookie Signature",
    collection: formats,
    desc: desc(
      formats,
      "Format standard — toutes saveurs disponibles (tarif partenaire).",
    ),
    category: "box",
    price: 15,
    stock: 200,
  },
  {
    id: "p_mini_cookie",
    name: "Mini Cookie",
    collection: formats,
    desc: desc(
      formats,
      "Réplique miniature des saveurs signature (tarif partenaire).",
    ),
    category: "box",
    price: 9,
    stock: 200,
  },
];

export const CATALOG_PRODUCT_IDS = NYC_COOKIE_CATALOG.map((p) => p.id);
