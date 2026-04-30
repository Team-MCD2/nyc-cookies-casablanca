-- =========================================================================
--  NYC COOKIES — Supabase schema (PostgreSQL)
--  Run this once in the Supabase SQL editor before starting the Next app.
--  Idempotent : safe to re-run.
-- =========================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Reset (safe during first-time setup) -------------------------
-- Drop in dependency order. Re-running this script is destructive: any data
-- in these tables will be lost. Comment out this block once you go live.
drop view  if exists public.v_invoice_with_pro cascade;
drop table if exists public.invitations cascade;
drop table if exists public.invoices    cascade;
drop table if exists public.orders      cascade;
drop table if exists public.pros        cascade;
drop table if exists public.customers   cascade;
drop table if exists public.products    cascade;

drop type if exists product_category cascade;
drop type if exists order_status     cascade;
drop type if exists payment_status   cascade;
drop type if exists invoice_status   cascade;
drop type if exists pro_status       cascade;
drop type if exists customer_type    cascade;

-- ---------- Enums --------------------------------------------------------
create type product_category as enum ('cookie', 'box', 'icecream');
create type order_status     as enum ('pending', 'preparing', 'ready', 'delivered', 'cancelled');
create type payment_status   as enum ('pending', 'paid');
create type invoice_status   as enum ('upcoming', 'paid', 'overdue');
create type pro_status       as enum ('active', 'inactive');
create type customer_type    as enum ('b2c', 'pro');

-- ---------- Tables ----------

-- Products
create table if not exists public.products (
  id           text primary key,                  -- e.g. p_soho
  name         text not null,
  description  text default '',
  category     product_category not null,
  price_mad    integer not null check (price_mad >= 0),
  stock        integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- B2C customers (linked to Clerk users)
create table if not exists public.customers (
  id              uuid primary key default uuid_generate_v4(),
  clerk_user_id   text unique,
  name            text not null,
  email           text not null,
  phone           text,
  orders_count    integer not null default 0,
  total_spent     integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_customers_clerk on public.customers(clerk_user_id);

-- Pros (B2B)
create table if not exists public.pros (
  id                    uuid primary key default uuid_generate_v4(),
  clerk_user_id         text unique,
  company               text not null,
  contact_name          text not null,
  email                 text not null,
  phone                 text,
  address               text,
  ice                   text,
  payment_terms_days    integer not null default 30,
  status                pro_status not null default 'active',
  orders_count          integer not null default 0,
  total_spent           integer not null default 0,
  outstanding_mad       integer not null default 0,
  created_at            timestamptz not null default now()
);
create index if not exists idx_pros_clerk on public.pros(clerk_user_id);

-- Orders (B2C + B2B)
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  reference       text unique not null,                       -- e.g. ord_2026_0001
  customer_type   customer_type not null,
  customer_id     uuid references public.customers(id) on delete set null,
  pro_id          uuid references public.pros(id) on delete set null,
  items           jsonb not null,                              -- [{ pid, qty }]
  total_mad       integer not null check (total_mad >= 0),
  status          order_status not null default 'pending',
  payment         payment_status not null default 'pending',
  created_at      timestamptz not null default now()
);
create index if not exists idx_orders_pro on public.orders(pro_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);

-- Invoices (pros only)
create table if not exists public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  reference       text unique not null,                        -- e.g. INV-2026-0001
  pro_id          uuid not null references public.pros(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,
  issue_date      date not null default current_date,
  due_date        date not null,
  amount_mad      integer not null check (amount_mad >= 0),
  status          invoice_status not null default 'upcoming',
  created_at      timestamptz not null default now()
);
create index if not exists idx_invoices_pro on public.invoices(pro_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- Pro invitations (admin → pro onboarding)
create table if not exists public.invitations (
  token         text primary key,
  company       text not null,
  contact_name  text not null,
  email         text not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_invitations_email on public.invitations(email);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.pros        enable row level security;
alter table public.orders      enable row level security;
alter table public.invoices    enable row level security;
alter table public.invitations enable row level security;

-- Products: anyone can read active products, only service role writes.
drop policy if exists "products_read_public" on public.products;
create policy "products_read_public" on public.products
  for select using (active = true);

-- All other tables: only service_role can read/write.
-- (Server actions use the service role key; the anon key cannot bypass RLS here.)

-- ---------- Helpful views ----------
create or replace view public.v_invoice_with_pro as
  select i.*, p.company as pro_company, p.contact_name as pro_contact
  from public.invoices i
  join public.pros p on p.id = i.pro_id;
