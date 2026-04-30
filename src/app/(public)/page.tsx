import Link from "next/link";
import Image from "next/image";
import { Cookie, Briefcase, Phone, Check, Mail, ArrowRight, CheckCircle, Truck, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/misc";
import { ProductCard } from "@/components/product-card";
import { Avatar } from "@/components/ui/avatar";
import { listActiveProducts } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const revalidate = 60; // ISR: refresh once a minute

export default async function LandingPage() {
  const all = await listActiveProducts().catch(() => []);
  const featured = all.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border py-[clamp(4rem,10vw,8rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(60% 50% at 80% 20%, rgba(213,74,42,0.12), transparent 60%),
              radial-gradient(50% 60% at 20% 80%, rgba(245,230,211,0.05), transparent 70%)
            `,
          }}
        />
        <div className="container relative z-10 grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
          <div className="stack-lg">
            <Eyebrow>Best cookies in town · Casablanca</Eyebrow>
            <h1 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[0.01em]">
              Le goût du <span className="text-accent">bonheur</span>
              <br />
              cuit chaque matin.
            </h1>
            <p className="max-w-[540px] text-[1.1rem] text-text-2">
              Des cookies new-yorkais moelleux à l'intérieur, croustillants au bord. 12 recettes
              d'auteur inspirées des quartiers de NYC, fraîchement préparées à Casablanca.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop">
                <Button size="lg" variant="primary">
                  <Cookie className="h-4 w-4" /> Voir la boutique
                </Button>
              </Link>
              <Link href="#pro">
                <Button size="lg" variant="outline">
                  <Briefcase className="h-4 w-4" /> Espace pros
                </Button>
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-6 text-[0.92rem] text-text-3">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" /> Cuits du jour
              </span>
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" /> Livraison Casablanca
              </span>
              <span className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-accent" /> Ingrédients premium
              </span>
            </div>
          </div>
          <div
            className="mx-auto grid aspect-square w-full max-w-[460px] place-items-center rounded-full border border-border"
            style={{ background: "radial-gradient(circle at 30% 30%, #1a1a1a, #050505 80%)" }}
          >
            <Image
              src="/nyclogo.png"
              alt="NYC Cookies logo"
              width={460}
              height={460}
              className="h-[70%] w-[70%] object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* Products preview */}
      <section id="products" className="section">
        <div className="container">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>La carte</Eyebrow>
              <h2 className="mt-2">Nos cookies signature</h2>
              <p className="mt-1 text-text-3">
                Chaque cookie porte le nom d'un quartier de New York. Choisis ta vibe.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="secondary">
                Tout voir <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} ctaLabel="Commander" />
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section
        id="story"
        className="section"
        style={{ background: "linear-gradient(180deg, transparent, rgba(213,74,42,0.04))" }}
      >
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <div className="stack">
            <Eyebrow>Notre histoire</Eyebrow>
            <h2>Casablanca rencontre Brooklyn.</h2>
            <p>
              NYC Cookies est né en 2022 d'une obsession : recréer à Casablanca le cookie
              new-yorkais ultime — généreux, fondant au cœur, doré sur les bords. Chaque recette
              s'inspire d'un quartier mythique : Soho, Bronx, Times Square, Madison Square…
            </p>
            <p>
              On travaille avec des ingrédients soigneusement sélectionnés, on cuit en petites
              quantités, et on livre le tout fraîchement préparé. La taste of happiness, version Casa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop">
                <Button>Découvrir la carte</Button>
              </Link>
              <a href={`tel:${SITE.phone}`}>
                <Button variant="ghost">
                  <Phone className="h-4 w-4" /> {SITE.phoneDisplay}
                </Button>
              </a>
            </div>
          </div>
          <Card
            className="border-border-strong"
            style={{ background: "radial-gradient(circle at 30% 30%, #1a1a1a, #050505 80%)" }}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Recettes signature", value: "12" },
                { label: "Année de création", value: "2022" },
                { label: "Note moyenne", value: <>4.9<span className="text-[1.4rem] text-text-3">/5</span></> },
                { label: "Livraisons / mois", value: "+1k" },
              ].map((k, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="text-[0.78rem] uppercase tracking-[0.16em] text-text-3">{k.label}</div>
                  <div className="font-display text-[2.2rem] leading-none tracking-[0.02em]">{k.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Pro */}
      <section id="pro" className="section">
        <div className="container">
          <Card
            className="border-accent"
            style={{
              background: "linear-gradient(135deg, rgba(213,74,42,0.12), transparent 60%)",
            }}
          >
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className="stack">
                <Eyebrow>Espace pros</Eyebrow>
                <h2>Cafés, hôtels, événements : on a votre dose.</h2>
                <p>
                  Vous êtes un café, un hôtel, un restaurant ou un organisateur d'événement ?
                  Bénéficiez d'un compte pro NYC Cookies : commandes en gros, factures
                  centralisées, paiement à 30/45 jours, et suivi en temps réel.
                </p>
                <ul className="stack-sm text-text-2">
                  {[
                    "Tarifs dégressifs sur volume",
                    "Espace dédié : commandes, factures, paiements",
                    "Délai de paiement adapté",
                    "Livraison Casablanca, planifiée",
                  ].map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      {it}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <a href={`mailto:${SITE.email}?subject=Demande%20d'acc%C3%A8s%20pro`}>
                    <Button>
                      <Mail className="h-4 w-4" /> Demander un accès pro
                    </Button>
                  </a>
                  <Link href="/login">
                    <Button variant="outline">Déjà client ? Se connecter</Button>
                  </Link>
                </div>
              </div>
              <div className="stack">
                <Card className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar size="lg" name="Hamza Cherkaoui" />
                    <div>
                      <div className="font-semibold">Hamza C. — Café Bricoli</div>
                      <div className="text-[0.85rem] text-text-3">Client pro depuis 2025</div>
                    </div>
                  </div>
                  <p className="text-[0.95rem] text-text-3">
                    « Je commande chaque semaine pour mon café. Le portail pro me fait gagner un
                    temps fou : je vois toutes mes factures, je paie quand je veux dans mon délai. »
                  </p>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="relative overflow-hidden p-4">
                    <div className="text-[0.78rem] uppercase tracking-[0.16em] text-text-3">Pros actifs</div>
                    <div className="mt-2 font-display text-[2.2rem] leading-none">+25</div>
                  </Card>
                  <Card className="relative overflow-hidden p-4">
                    <div className="text-[0.78rem] uppercase tracking-[0.16em] text-text-3">Délai paiement</div>
                    <div className="mt-2 font-display text-[2.2rem] leading-none">30j</div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
