# NYC Cookies Casablanca — Phase 2 (Next.js)

Plateforme de gestion **NYC Cookies Casablanca** (B2C + B2B Pros) en **Next.js 15 + Tailwind + Clerk + Supabase**.

> Cette codebase remplace le prototype HTML/JS de Phase 1 (`../prototype/`).
> Tous les tokens, composants et parcours du prototype sont portés en composants React maison — **sans shadcn/ui, sans Radix** : 100 % Tailwind custom.

---

## 1. Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15** (App Router, TS, Server Components) | SSR, server actions, route groups, RSC |
| Style | **Tailwind 3.4** + tokens portés depuis le prototype | DA NYC fidèle, zéro lib UI |
| Composants | **Custom React** (`src/components/ui/*`) | Pas de shadcn, pas de Radix, pas de HeadlessUI |
| Icônes | **lucide-react** | Cohérent avec le prototype |
| Auth | **Clerk** (admin / pro / b2c via `publicMetadata.role`) | Sessions, social login, middleware |
| DB | **Supabase** (PostgreSQL + RLS) | Service role côté serveur, read public sur produits |
| Forms | `react-hook-form` + `zod` | Validation client + server actions |
| Toast | Custom pubsub (`src/components/ui/toaster.tsx`) | Aucune dépendance |

---

## 2. Setup local (5 min)

### 2.1. Installation

```powershell
# depuis le dossier nyc-cookies/
npm install
```

> Tous les warnings TS / "Cannot find module" disparaissent après `npm install`. C'est normal tant que les packages ne sont pas téléchargés.

### 2.2. Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (déjà fait : `erbzzajoqrsmcwoxfxza`).
2. Dans l'éditeur SQL, exécute dans l'ordre :
   - `supabase/schema.sql` — crée les tables, enums, RLS
   - `supabase/seed.sql` — insère les produits + pros + invitations de démo
3. Récupère sur [supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2.3. Configuration Clerk

1. Crée une app sur [dashboard.clerk.com](https://dashboard.clerk.com).
2. **User & Authentication → Email, Phone, Username** : active *Email address*.
3. **Sessions → Customize session token** : ajoute le claim suivant pour exposer le rôle :
   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```
4. Récupère les clés API (Publishable + Secret).
5. Pour donner le rôle **admin** à un utilisateur, va sur Clerk Dashboard → Users → clic sur l'utilisateur → *Public metadata* → ajoute :
   ```json
   { "role": "admin" }
   ```
   Pareil pour `"pro"` et `"b2c"` (par défaut, non-renseigné = `"b2c"`).

### 2.4. Variables d'environnement

```powershell
Copy-Item .env.local.example .env.local
# puis édite .env.local avec tes vraies clés
```

### 2.5. Lancer le dev server

```powershell
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## 3. Structure du projet

```
nyc-cookies/
├── public/
│   └── nyclogo.png
├── src/
│   ├── app/
│   │   ├── layout.tsx                          ← Root (ClerkProvider + Toaster + fonts)
│   │   ├── globals.css                         ← Tokens Tailwind + reset
│   │   ├── (public)/
│   │   │   ├── layout.tsx                      ← Header + Footer
│   │   │   ├── page.tsx                        ← Landing
│   │   │   ├── shop/page.tsx                   ← Boutique (server)
│   │   │   ├── shop/shop-client.tsx            ← Filtres, panier, modal
│   │   │   └── mentions-legales/page.tsx       ← Légal (Loi 09-08, CNDP)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                      ← Side panel + form area
│   │   │   ├── login/[[...login]]/page.tsx     ← Clerk <SignIn />
│   │   │   ├── signup/[[...signup]]/page.tsx   ← Clerk <SignUp />
│   │   │   └── pro-invite/page.tsx             ← Activation pro (token)
│   │   ├── (admin)/admin/
│   │   │   ├── layout.tsx                      ← AppShell + role guard
│   │   │   ├── dashboard/page.tsx              ← KPIs, recent orders & invoices
│   │   │   ├── products/page.tsx               ← Catalogue
│   │   │   ├── orders/page.tsx                 ← Toutes commandes
│   │   │   ├── customers/page.tsx              ← Clients B2C
│   │   │   ├── pros/page.tsx                   ← Clients pros + invitations
│   │   │   ├── pros/invite-form.tsx            ← Modal "Inviter un pro"
│   │   │   └── invoices/page.tsx               ← Factures
│   │   └── (pro)/pro/
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx              ← Bienvenue + KPIs perso
│   │       ├── order/page.tsx                  ← Nouvelle commande
│   │       ├── order/order-client.tsx          ← Catalogue + panier sticky
│   │       ├── orders/page.tsx                 ← Mes commandes
│   │       └── invoices/page.tsx               ← Mes factures
│   ├── components/
│   │   ├── ui/                                 ← Primitives 100% Tailwind custom
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── modal.tsx                       ← Custom (Escape, backdrop, body lock)
│   │   │   ├── toaster.tsx                     ← Custom pubsub
│   │   │   ├── kpi.tsx
│   │   │   ├── table.tsx
│   │   │   └── misc.tsx                        ← Empty, Eyebrow, PageHeader, Container
│   │   ├── layout/
│   │   │   ├── public-header.tsx
│   │   │   ├── public-footer.tsx               ← Réplique du prototype + Microdidact
│   │   │   └── app-shell.tsx                   ← Sidebar + Topbar (admin/pro)
│   │   ├── product-card.tsx
│   │   └── status-badge.tsx                    ← OrderStatus / InvoiceStatus / etc.
│   ├── lib/
│   │   ├── utils.ts                            ← cn, money, formatDate, initials
│   │   ├── types.ts                            ← Domain types (Product, Order, …)
│   │   ├── site.ts                             ← Brand info + nav config
│   │   ├── auth.ts                             ← Session helpers (Clerk + role)
│   │   ├── queries.ts                          ← Supabase reads (camelCase mapping)
│   │   ├── actions.ts                          ← Server actions (zod-validated)
│   │   └── supabase/
│   │       ├── client.ts                       ← Browser (anon)
│   │       ├── server.ts                       ← Server Component (anon)
│   │       └── admin.ts                        ← Service role (server-only)
│   └── middleware.ts                           ← Clerk + role-based redirects
├── supabase/
│   ├── schema.sql                              ← Tables + RLS + enums
│   └── seed.sql                                ← Données de démo (mirror prototype)
├── tailwind.config.ts                          ← Tokens (couleurs, fonts, shadows)
├── package.json
├── tsconfig.json
├── next.config.mjs
└── postcss.config.mjs
```

---

## 4. Direction artistique

**Tokens portés du prototype** dans `tailwind.config.ts` :

| Token Tailwind | Hex | Usage |
|---|---|---|
| `bg` | `#0a0a0a` | Fond principal |
| `surface` | `#141414` | Cards, sidebar |
| `surface-2` | `#1c1c1c` | Inputs, table headers |
| `text` | `#fafafa` | Texte principal |
| `text-2` | `#d4d4d4` | Texte secondaire |
| `text-3` | `#a3a3a3` | Texte tertiaire |
| `accent` | `#d54a2a` | Rouge-rouille (croûte de cookie) |
| `accent-hover` | `#e75a3a` | Hover state |
| `cream` | `#f5e6d3` | Tons chauds (product mark) |

**Fonts** chargées via `next/font/google` (zéro CLS) :
- `--font-display` : Bebas Neue (titres, KPI, badges)
- `--font-body` : Inter (corps)

---

## 5. Parcours fonctionnels

### A. Public / B2C

1. **`/`** — landing : hero, produits phares (ISR 60s), histoire, CTA pros
2. **`/shop`** — boutique : filtres par catégorie, panier (localStorage), modal de checkout
3. **`/mentions-legales`** — page légale (Loi 09-08, CNDP)

### B. Auth (Clerk)

- **`/login`** — `<SignIn />` Clerk dans le layout NYC
- **`/signup`** — `<SignUp />` Clerk dans le layout NYC
- **`/pro-invite?token=…`** — token vérifié dans Supabase, formulaire pré-rempli

### C. Admin (`role: "admin"`)

- **`/admin/dashboard`** — KPIs (CA, encours, à préparer, stock faible)
- **`/admin/products`** — catalogue
- **`/admin/orders`** — toutes les commandes
- **`/admin/customers`** — clients B2C
- **`/admin/pros`** — pros + bouton *Inviter un pro* (server action `createInvitation`)
- **`/admin/invoices`** — factures

### D. Pro (`role: "pro"`)

- **`/pro/dashboard`** — KPIs perso (à venir, en retard, payées, délai)
- **`/pro/order`** — composer une commande (server action `placeOrder` → génère facture 30j)
- **`/pro/orders`** — historique
- **`/pro/invoices`** — factures perso

---

## 6. Server Actions

Toutes dans `src/lib/actions.ts`, validées avec Zod, vérifient le rôle Clerk avant d'écrire :

| Action | Rôle requis | Effet |
|---|---|---|
| `upsertProduct(data)` | admin | Crée/met à jour un produit |
| `deleteProduct(id)` | admin | Supprime un produit |
| `placeOrder(items)` | tout user | Crée commande + facture 30j (si pro) |
| `advanceOrderStatus(ref)` | admin | `pending → preparing → ready → delivered` |
| `markInvoicePaid(ref)` | admin/pro | Marque facture payée |
| `createInvitation(data)` | admin | Génère un token d'invitation pro |

Chaque action appelle `revalidatePath()` sur les routes concernées pour invalider le cache.

---

## 7. RLS & sécurité

- **Produits** : `select` public si `active = true`, sinon service role uniquement.
- **Toutes les autres tables** : `select/insert/update/delete` réservés au service role.
- Les server actions s'exécutent côté serveur avec la clé `SUPABASE_SERVICE_ROLE_KEY`, et **vérifient l'auth Clerk + le rôle** avant chaque écriture (`requireRole(["admin"])`).
- La clé `SUPABASE_SERVICE_ROLE_KEY` n'est **jamais** exposée au client (pas de `NEXT_PUBLIC_` prefix).

---

## 8. Lien Clerk ↔ Supabase

Stratégie : **Clerk gère l'identité, Supabase stocke l'app**.
- Quand un user signe in via Clerk, son `userId` est mappé à un row `customers` ou `pros` via la colonne `clerk_user_id`.
- Lors de l'invitation pro, l'admin crée un row `pros` (sans `clerk_user_id`) + une `invitation` avec un token. Le pro complète son inscription via `/pro-invite?token=…` et son `clerkUserId` est lié au row pro existant (à câbler dans le webhook `user.created` de Clerk — TODO).

---

## 9. À compléter (post-MVP)

- [ ] Webhook Clerk `user.created` → POST `/api/webhooks/clerk` qui lie automatiquement `clerk_user_id` aux pros/customers via l'invitation token.
- [ ] CRUD admin produits (le formulaire d'édition n'est pas encore branché — `upsertProduct` existe, il faut une modal).
- [ ] Détail commande / facture (sheet drawer).
- [ ] Génération PDF facture (impression).
- [ ] Notifications email (Resend).
- [ ] Storage Supabase pour les vraies photos produits (pour l'instant le visuel = monogramme).

---

## 10. Tests rapides

```powershell
npm run typecheck   # vérifie les types
npm run lint        # ESLint
npm run build       # build production
```

---

## 11. Comptes de démo (post Clerk setup)

Après avoir créé tes utilisateurs dans Clerk et leur avoir attribué `role` dans publicMetadata, tu peux te connecter avec n'importe quel email Clerk valide. Pour créer rapidement les comptes pros, lance d'abord la migration `seed.sql` qui crée les rows pros, puis utilise le bouton *Inviter un pro* dans `/admin/pros` pour générer les liens d'activation.

**Lien démo prêt à l'emploi** (le token est dans la seed) :
`http://localhost:3000/pro-invite?token=inv_DEMO-PRO-2026`
