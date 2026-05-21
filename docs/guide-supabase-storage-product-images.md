# Guide — Bucket Storage `product-images`

## Ce n’est pas encore fait automatiquement

Le code d’upload (`/api/admin/upload-product-image`) **attend** un bucket nommé **`product-images`**, mais Supabase **ne le crée pas tout seul** au déploiement. Vous devez le créer **une fois** dans votre projet Supabase.

Sans ce bucket, l’ajout d’image produit dans l’admin affichera une erreur du type : *« Créez le bucket Supabase product-images »*.

---

## Méthode 1 — Interface Supabase (recommandée)

1. Ouvrez [supabase.com](https://supabase.com) → votre projet NYC Cookies.
2. Menu gauche → **Storage**.
3. Cliquez **New bucket**.
4. Renseignez :
   - **Name** : `product-images` (exactement ce nom, minuscules, tiret).
   - **Public bucket** : **activé** (coché).
5. Validez **Create bucket**.

### Vérification

- Dans **Storage** → vous devez voir le bucket `product-images`.
- Test : Admin → **Produits** → créer/modifier un produit → **Image (optionnel)** → choisir un fichier → l’upload doit réussir.

---

## Méthode 2 — SQL (alternative)

Dans **SQL Editor** → New query → exécutez :

```sql
-- Créer le bucket public (idempotent)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Lecture publique des fichiers
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Upload réservé au service role (l’API admin utilise SUPABASE_SERVICE_ROLE_KEY)
create policy "Service role upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images');
```

Si une policy existe déjà, Supabase peut renvoyer une erreur « already exists » — vous pouvez ignorer ou adapter le nom de la policy.

---

## Comportement dans l’application

| Cas | Résultat |
|-----|----------|
| Image uploadée | URL enregistrée dans `products.image_url`, affichée partout. |
| Pas d’upload | Comportement inchangé : image par défaut selon le **nom** du cookie (`getProductImage`). |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Erreur 500 à l’upload | Vérifier que le bucket s’appelle bien `product-images` et est **public**. |
| Image ne s’affiche pas | Ouvrir l’URL dans le navigateur ; vérifier `NEXT_PUBLIC_SUPABASE_URL` sur Vercel. |
| Bucket privé | Passer le bucket en **public** ou configurer des URLs signées (non implémenté dans ce projet). |
