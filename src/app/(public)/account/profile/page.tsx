import { ProfileEmbed } from "./profile-embed";

export const dynamic = "force-dynamic";

export default function AccountProfilePage() {
  return (
    <div className="stack-lg">
      <div>
        <h2 className="font-display text-[1.4rem] tracking-[0.04em]">
          Profil & sécurité
        </h2>
        <p className="mt-1 text-[0.9rem] text-text-3">
          Modifie ton nom, ton email, ton mot de passe et tes méthodes de
          connexion. Ces informations sont gérées de manière sécurisée par
          notre fournisseur d'authentification.
        </p>
      </div>
      <ProfileEmbed />
    </div>
  );
}
