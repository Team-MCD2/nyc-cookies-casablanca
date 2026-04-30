import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { SITE } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site NYC Cookies Casablanca : éditeur, hébergeur, conditions d'utilisation, données personnelles et cookies.",
  robots: { index: false, follow: false },
};

export default function MentionsLegalesPage() {
  const lastUpdate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="py-[clamp(3rem,7vw,5rem)]">
      <div className="container max-w-[880px]">
        <Eyebrow>Informations légales</Eyebrow>
        <h1 className="mt-3">Mentions légales</h1>
        <p className="mt-3 text-[0.88rem] text-text-3">Dernière mise à jour : {lastUpdate}</p>

        <article className="mt-8 max-w-[820px] [&_a]:border-b [&_a]:border-transparent [&_a]:text-accent [&_a:hover]:border-accent [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-border [&_h2]:pt-3 [&_h2]:font-display [&_h2]:text-[1.4rem] [&_h2]:tracking-[0.04em] [&_h2]:scroll-mt-24 [&_h2:first-child]:mt-0 [&_h2:first-child]:border-t-0 [&_h2:first-child]:pt-0 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-[1.05rem] [&_h3]:tracking-[0.04em] [&_li]:py-1 [&_li]:text-[0.95rem] [&_li]:text-text-2 [&_p]:mb-4 [&_p]:text-[0.95rem] [&_p]:leading-[1.7] [&_p]:text-text-2 [&_strong]:font-semibold [&_strong]:text-text [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul_li::marker]:text-accent">
          <h2>1. Éditeur du site</h2>
          <p>Le site <strong>{SITE.url.replace(/https?:\/\//, "")}</strong> est édité par :</p>
          <ul>
            <li><strong>Dénomination sociale :</strong> {SITE.fullName}</li>
            <li><strong>Forme juridique :</strong> SARL</li>
            <li><strong>Capital social :</strong> [À compléter]</li>
            <li><strong>Siège social :</strong> {SITE.address.street}, {SITE.address.complement}, {SITE.address.city}, {SITE.address.country}</li>
            <li><strong>RC (Registre de Commerce) :</strong> [À compléter] — Casablanca</li>
            <li><strong>ICE :</strong> [À compléter]</li>
            <li><strong>IF (Identifiant Fiscal) :</strong> [À compléter]</li>
            <li><strong>TP (Patente) :</strong> [À compléter]</li>
            <li><strong>CNSS :</strong> [À compléter]</li>
            <li><strong>Téléphone :</strong> <a href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a></li>
            <li><strong>Email :</strong> <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><strong>Directeur de la publication :</strong> Le Gérant de {SITE.fullName}</li>
          </ul>

          <h2>2. Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <ul>
            <li><strong>Vercel Inc.</strong></li>
            <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
            <li>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
          </ul>
          <p>Les données applicatives sont stockées via <strong>Supabase</strong> (Supabase Inc., Singapour).</p>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments présents sur ce site (textes, photographies, logos, graphismes,
            recettes, vidéos, icônes, etc.) ainsi que la structure du site sont la propriété
            exclusive de <strong>{SITE.fullName}</strong> ou font l'objet d'une autorisation
            d'utilisation. Toute reproduction, représentation, modification, publication, adaptation
            — totale ou partielle — des éléments du site est interdite sans autorisation écrite préalable.
          </p>
          <p>
            Les marques, logos, dénominations et noms de produits cités (NYC Cookies, Soho, Bronx,
            Times Square, Madison Square…) sont des marques déposées ou en cours de dépôt par {SITE.fullName}.
          </p>

          <h2 id="confidentialite">4. Données personnelles (Loi 09-08)</h2>
          <p>
            Conformément à la <strong>loi marocaine n° 09-08</strong> relative à la protection des
            personnes physiques à l'égard du traitement des données à caractère personnel, vous
            disposez d'un droit d'accès, de rectification, d'opposition et de suppression concernant
            vos données personnelles.
          </p>
          <p>
            Les données collectées via les formulaires (création de compte, commande, contact,
            espace pros) sont utilisées exclusivement pour la gestion de votre relation client :
            traitement des commandes, facturation, livraison, support et communication commerciale
            (avec votre consentement).
          </p>
          <h3>Vos droits</h3>
          <p>
            Pour exercer vos droits, contactez-nous par email à
            {" "}<a href={`mailto:${SITE.email}`}>{SITE.email}</a> ou par courrier à l'adresse du
            siège social ci-dessus.
          </p>
          <p>
            Vous pouvez également saisir la <strong>CNDP</strong> :
            {" "}<a href="https://www.cndp.ma" target="_blank" rel="noopener noreferrer">www.cndp.ma</a>.
          </p>
          <h3>Conservation des données</h3>
          <ul>
            <li>Données de compte : durée de la relation commerciale + 3 ans après la dernière activité.</li>
            <li>Factures et pièces comptables : 10 ans (obligation légale).</li>
            <li>Cookies de mesure d'audience : 13 mois maximum.</li>
          </ul>

          <h2 id="cookies">5. Cookies</h2>
          <p>
            Ce site utilise des cookies strictement nécessaires à son fonctionnement (session de
            connexion, panier, préférences), ainsi que, sous réserve de votre consentement, des
            cookies de mesure d'audience et des cookies de services tiers (cartes, réseaux sociaux,
            plateformes de paiement et de livraison).
          </p>
          <h3>Catégories de cookies</h3>
          <ul>
            <li><strong>Essentiels :</strong> session, panier, authentification.</li>
            <li><strong>Mesure :</strong> statistiques d'usage anonymisées.</li>
            <li><strong>Tiers :</strong> intégrations sociales et plateformes de livraison.</li>
          </ul>
          <p>Vous pouvez modifier vos préférences via les paramètres de votre navigateur.</p>

          <h2>6. Conditions d'utilisation</h2>
          <p>
            L'utilisation du site implique l'acceptation pleine et entière des présentes mentions
            légales. En passant commande, le client reconnaît avoir pris connaissance des conditions
            générales de vente et les avoir acceptées.
          </p>

          <h2>7. Responsabilité</h2>
          <p>
            {SITE.fullName} s'efforce de fournir des informations aussi précises que possible.
            Toutefois, elle ne pourra être tenue responsable des omissions, inexactitudes ou
            carences dans la mise à jour. Les visuels des produits ne sont pas contractuels.
          </p>

          <h2>8. Liens hypertextes</h2>
          <p>
            Le site peut contenir des liens vers des sites tiers (réseaux sociaux, plateformes de
            livraison, partenaires). {SITE.fullName} n'exerce aucun contrôle sur ces sites et
            décline toute responsabilité quant à leur contenu ou leurs pratiques.
          </p>

          <h2>9. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au <strong>droit marocain</strong>. En cas
            de litige et après tentative de résolution amiable, compétence exclusive est donnée aux
            tribunaux de Casablanca.
          </p>
        </article>

        <div className="mt-10">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
