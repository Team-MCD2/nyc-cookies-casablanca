# Guide complet — Bot WhatsApp NYC Cookies

Ce guide explique comment **connecter le bot à un compte WhatsApp**, **changer le numéro du bot**, et **autoriser d’autres numéros** pour piloter le bot (commandes admin).

---

## Architecture (en bref)

```text
Site Next.js (Vercel)  ←── API ──→  Bot Node.js (Baileys)  ←──→  WhatsApp
     /admin/whatsapp                    bot/index.js
```

- Le **site** ne parle pas directement à WhatsApp : il appelle le **serveur bot** (`NEXT_PUBLIC_WHATSAPP_BOT_URL`).
- Le bot garde la session WhatsApp dans le dossier `bot/auth_info_baileys/` (sur la machine où tourne le bot).
- Les **numéros autorisés** sont la liste des admins qui peuvent envoyer des commandes (`.menu`, `.commande`, etc.).

---

## Prérequis

### 1. Variables d’environnement

**Sur le site (Vercel / `.env.local`)** :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `NEXT_PUBLIC_WHATSAPP_BOT_URL` | `https://votre-bot.example.com` | URL publique du serveur bot |
| `NEXT_PUBLIC_SITE_URL` | `https://nyc-cookies-casablanca.vercel.app` | URL du site (liens dans les messages) |
| `SITE_API_SECRET` | chaîne secrète longue | Secret partagé site ↔ bot |

**Sur le serveur bot (`bot/.env` ou variables système)** :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `PORT` | `3001` | Port d’écoute du bot (défaut 3001) |
| `NEXT_PUBLIC_SITE_URL` | même URL que le site | Appels API commandes / pros |
| `SITE_API_SECRET` | **identique** au site | Authentification API |
| `MANDATORY_ADMIN_PHONE` | `212612345678` | Numéro admin **toujours** autorisé (sans indicatif +) |
| `CRON_TIMEZONE` | `Africa/Casablanca` | Fuseau des rappels automatiques |

> **Important** : `SITE_API_SECRET` doit être **exactement la même valeur** sur le site et sur le bot. Sinon `.commande`, `.update`, etc. échoueront.

### 2. Lancer le bot

```powershell
cd bot
npm install
# Créer bot/.env avec les variables ci-dessus
npm start
```

Le bot écoute sur `http://localhost:3001` (ou le `PORT` configuré).

En production, le bot doit tourner **24h/24** sur un VPS, Railway, Render, etc. — pas sur Vercel (le site seul ne suffit pas pour WhatsApp).

---

## Étape 1 — Connecter WhatsApp au bot

### Depuis le dashboard admin

1. Connectez-vous en **admin** sur le site.
2. Allez dans **Admin → WhatsApp Bot** (`/admin/whatsapp`).
3. Vérifiez que le statut n’est pas « Bot inaccessible » (sinon : URL bot ou serveur bot incorrect).

### Deux méthodes de liaison

#### A. Code d’appairage (recommandé)

1. Choisissez **Code d’appairage**.
2. Entrez le **numéro WhatsApp du compte à utiliser comme bot** (format international **sans** `+`, ex. `212612345678`).
   - C’est le numéro de la **carte SIM / compte WhatsApp** qui enverra les messages clients.
3. Cliquez **Générer le Code**.
4. Sur le téléphone de ce numéro :
   - WhatsApp → **Paramètres** → **Appareils connectés** → **Connecter un appareil**
   - **Connecter avec un numéro de téléphone** (si proposé)
   - Saisissez le code affiché (format `XXXX-XXXX`).
5. Quand c’est bon, le dashboard affiche **Connecté**.

#### B. QR Code

1. Choisissez **QR Code**.
2. Cliquez **Générer le QR**.
3. Sur le téléphone du compte bot : WhatsApp → Appareils connectés → Scanner le QR.
4. Attendez le statut **Connecté**.

### Test

Depuis un **numéro déjà autorisé** (voir section 3), envoyez au bot :

```text
.ping
```

Réponse attendue : *Bot est actif et connecté! Pong! ✅*

Ou :

```text
.menu
```

→ Menu avec sections **Général**, **Boutique — commandes**, etc.

---

## Étape 2 — Changer le numéro WhatsApp du bot

Le « numéro du bot » = le **compte WhatsApp** lié à Baileys (celui qui envoie invitations pro, notifications, etc.).

### Procédure

1. **Admin → WhatsApp Bot** → bouton **Déconnecter le bot**.
   - Cela supprime la session locale (`auth_info_baileys`) sur le serveur du bot.
2. Attendez le statut **Déconnecté**.
3. Recommencez la **Étape 1** avec le **nouveau numéro** (code d’appairage ou QR).
4. Utilisez le téléphone du **nouveau** compte WhatsApp pour valider le code ou scanner le QR.

### Points importants

- Vous ne « changez » pas le numéro dans un fichier : vous **déconnectez** puis **reconnectez** un autre compte WhatsApp.
- Les **numéros autorisés** (admins) restent dans `bot/bot_config.json` sauf si vous les supprimez.
- Après changement de numéro bot, les clients verront les messages partir du **nouveau** numéro WhatsApp.

---

## Étape 3 — Contrôler le bot depuis un autre numéro (admins)

Deux notions distinctes :

| Notion | Description |
|--------|-------------|
| **Numéro du bot** | Compte WhatsApp connecté au serveur (envoie les messages). |
| **Numéro autorisé** | Personne qui peut **envoyer des commandes** au bot (`.commande`, `.statut`, …). |

Pour qu’un collègue pilote le bot depuis **son** téléphone, il faut **ajouter son numéro** à la liste des numéros autorisés.

### Méthode A — Dashboard admin (recommandée)

1. **Admin → WhatsApp Bot** → section **Configuration**.
2. **Ajouter un numéro autorisé** : ex. `212698765432` (chiffres uniquement, indicatif pays inclus).
3. Cliquez **Ajouter**.
4. La liste **Numéros autorisés** se met à jour (rafraîchissement auto toutes les 5 s si le bot est connecté).

**Retirer un numéro** : icône poubelle à côté du numéro dans la liste.

**Tout supprimer** (sauf le numéro obligatoire) : bouton **Tout supprimer**.

### Méthode B — Depuis WhatsApp (si vous êtes déjà autorisé)

Depuis un numéro admin déjà dans la liste :

```text
.authorise 212698765432
```

Retirer l’accès :

```text
.unauthorise 212698765432
```

Formats acceptés : `.authorise 212…` ou `.authorise(212…)`.

### Numéro obligatoire (`MANDATORY_ADMIN_PHONE`)

- Défini dans les variables d’environnement du **serveur bot**.
- **Toujours autorisé**, même s’il n’apparaît pas dans la liste du dashboard.
- **Impossible à supprimer** via `.unauthorise` ou le dashboard.
- Pour le changer : modifier `MANDATORY_ADMIN_PHONE` sur le serveur bot et **redémarrer** le bot.

### Si un numéro reçoit « Numéro non autorisé »

1. Vérifier le format : `212…` sans espaces ni `+`.
2. L’ajouter via le dashboard ou `.authorise`.
3. Vérifier que le bot est **connecté** (sinon la config ne s’applique pas aux messages entrants).

---

## Étape 4 — Notifications automatiques

Sans commande, le bot envoie déjà :

- **Nouvelle commande pro** → tous les numéros autorisés + numéro obligatoire.
- **Nouvelle demande compte pro** → idem.
- **Invitation pro acceptée** → message au numéro de la société avec lien `/pro-invite`.
- **Facture envoyée au client** → WhatsApp au pro concerné.

Rappels quotidiens aux pros actifs : réglables avec **Heure d’envoi** sur `/admin/whatsapp` ou commande `.creneau 20:00` (fuseau Maroc).

---

## Commandes utiles (résumé)

Tapez `.menu` sur WhatsApp pour la liste complète.

| Commande | Effet |
|----------|--------|
| `.menu` | Liste des commandes (noms seuls, sans explications) |
| `.guide` | Aide détaillée (à quoi sert chaque commande + exemples) |
| `.ping` | Test connexion |
| `.update` | Résumé admin (commandes, factures **à payer**, demandes pro) |
| `.commande ord_2026_0001` | Détail commande (statut, paiement, client pro) |
| `.statut ord_2026_0001 prep` | Changer statut commande |
| `.paiement ord_2026_0001 paye` | Paiement commande **+ facture liée** (Payée / À payer) |
| `.authorise 212…` | Autoriser un admin |
| `.unauthorise 212…` | Retirer un admin |

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Dashboard : « Bot inaccessible » | Bot arrêté ou mauvaise URL | Démarrer `npm start` dans `bot/`, vérifier `NEXT_PUBLIC_WHATSAPP_BOT_URL` |
| `.commande` → commande introuvable | Référence incorrecte ou site injoignable | Vérifier la commande en base ; `SITE_API_SECRET` identique ; `NEXT_PUBLIC_SITE_URL` correct |
| QR / code expire | Délai WhatsApp | Regénérer QR ou code |
| Messages `undefined` | Donnée manquante en base | Mettre à jour le site ; redémarrer le bot |
| Collègue ne peut pas commander | Numéro non autorisé | `.authorise` ou dashboard Configuration |
| Upload image produit échoue | Bucket Supabase manquant | Voir [guide-supabase-storage-product-images.md](./guide-supabase-storage-product-images.md) |

---

## Fichiers utiles (développeurs)

| Fichier | Rôle |
|---------|------|
| `bot/index.js` | Logique WhatsApp, commandes, cron |
| `bot/bot_config.json` | Heure cron + numéros autorisés additionnels |
| `bot/auth_info_baileys/` | Session WhatsApp (ne pas committer) |
| `src/app/(admin)/admin/whatsapp/page.tsx` | Interface admin |
| `src/lib/whatsapp-bot.ts` | Envoi notifications site → bot |

---

## Checklist mise en production

- [ ] Bot déployé et accessible en HTTPS (ou tunnel pour tests).
- [ ] `NEXT_PUBLIC_WHATSAPP_BOT_URL` pointe vers ce serveur.
- [ ] `SITE_API_SECRET` identique site + bot.
- [ ] WhatsApp connecté (statut vert sur `/admin/whatsapp`).
- [ ] Au moins un numéro admin ajouté (ou `MANDATORY_ADMIN_PHONE` configuré).
- [ ] Test `.ping` et `.commande REF` depuis un numéro autorisé.
- [ ] Bucket `product-images` créé si upload photos produits.
