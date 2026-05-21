-- Invoice: admin-only until sent; optional custom TVA
alter table public.invoices
  add column if not exists sent_to_client boolean not null default false;

alter table public.invoices
  add column if not exists tva_rate numeric(5, 2);

alter table public.invoices
  add column if not exists amount_ht_mad integer;

-- Les factures déjà émises restent visibles côté pro (optionnel, à exécuter une fois si besoin) :
-- update public.invoices set sent_to_client = true where issue_date < current_date;

-- Bucket Supabase pour images produits (Dashboard → Storage → New bucket « product-images », public)
