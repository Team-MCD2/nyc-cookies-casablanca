-- Invoice: admin-only until sent; optional custom TVA
alter table public.invoices
  add column if not exists sent_to_client boolean not null default false;

alter table public.invoices
  add column if not exists tva_rate numeric(5, 2);

alter table public.invoices
  add column if not exists amount_ht_mad integer;

-- Les factures déjà émises restent visibles côté pro (optionnel, à exécuter une fois si besoin) :
-- update public.invoices set sent_to_client = true where issue_date < current_date;

-- Bucket Storage pour images produits (voir docs/guide-supabase-storage-product-images.md)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Lecture publique
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Écriture via service role (API admin)
drop policy if exists "Service role upload product images" on storage.objects;
create policy "Service role upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images');
