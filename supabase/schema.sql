-- =====================================================================
-- AZARIS : schéma Supabase
-- À exécuter une seule fois dans Supabase > SQL Editor > New query.
-- =====================================================================

-- ---------- Administrateurs ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

-- ---------- Produits ----------
create table if not exists public.products (
  id          text primary key,
  name        text not null,
  code        text not null default '',
  category    text not null default 'shoes' check (category in ('shoes', 'sandals')),
  tag         text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  old_price   numeric(10,2) not null default 0,
  stock       integer not null default 0 check (stock >= 0),
  description text not null default '',
  specs       text[] not null default '{}',
  sizes       integer[] not null default '{36,37,38,39,40,41,42,43,44,45,46}',
  images      text[] not null default '{}',
  hidden      boolean not null default false,
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (hidden = false or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Paramètres de la boutique ----------
create table if not exists public.settings (
  id   integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'
);
alter table public.settings enable row level security;

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.settings (id, data) values (1, jsonb_build_object(
  'name', 'AZARIS',
  'whatsapp', '212679466809',
  'shippingFee', 0,
  'topbar', 'Livraison offerte au Maroc. Paiement à la livraison.',
  'email', '', 'instagram', '', 'tiktok', '', 'facebook', ''
)) on conflict (id) do nothing;

-- ---------- Commandes ----------
create table if not exists public.orders (
  id               text primary key,
  created_at       timestamptz not null default now(),
  items            jsonb not null,
  subtotal         numeric(10,2) not null,
  shipping         numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_city    text not null,
  customer_address text not null,
  status           text not null default 'Nouvelle'
                   check (status in ('Nouvelle', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée')),
  note             text not null default ''
);
alter table public.orders enable row level security;

-- Les clients ne lisent ni ne modifient les commandes : ils passent par place_order().
drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- Création d'une commande par un client.
-- Les prix sont recalculés côté serveur à partir de la table products (le client ne peut pas les modifier)
-- et le stock est décrémenté.
create or replace function public.place_order(p_id text, p_items jsonb, p_customer jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  it        jsonb;
  prod      public.products%rowtype;
  lines     jsonb := '[]'::jsonb;
  v_sub     numeric := 0;
  v_ship    numeric := 0;
  v_qty     integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Panier invalide';
  end if;
  if coalesce(length(trim(p_customer->>'name')), 0) < 2 or coalesce(length(trim(p_customer->>'phone')), 0) < 9 then
    raise exception 'Client invalide';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into prod from public.products where id = it->>'id' and hidden = false;
    if not found then raise exception 'Produit introuvable : %', it->>'id'; end if;
    v_qty := greatest(1, least(20, coalesce((it->>'qty')::int, 1)));
    lines := lines || jsonb_build_object('id', prod.id, 'name', prod.name, 'size', (it->>'size')::int, 'qty', v_qty, 'price', prod.price);
    v_sub := v_sub + prod.price * v_qty;
    update public.products set stock = greatest(0, stock - v_qty) where id = prod.id;
  end loop;

  select coalesce((data->>'shippingFee')::numeric, 0) into v_ship from public.settings where id = 1;

  insert into public.orders (id, items, subtotal, shipping, total, customer_name, customer_phone, customer_city, customer_address)
  values (left(p_id, 40), lines, v_sub, coalesce(v_ship, 0), v_sub + coalesce(v_ship, 0),
          left(trim(p_customer->>'name'), 120), left(trim(p_customer->>'phone'), 30),
          left(trim(p_customer->>'city'), 80), left(trim(p_customer->>'address'), 300));
  return p_id;
end;
$$;
revoke all on function public.place_order(text, jsonb, jsonb) from public;
grant execute on function public.place_order(text, jsonb, jsonb) to anon, authenticated;

-- Droits d'accès aux tables (les règles RLS ci-dessus filtrent ce que chacun voit)
grant select on public.products, public.settings to anon;
grant select, insert, update, delete on public.products, public.settings, public.orders to authenticated;
grant select on public.admins to authenticated;

-- Temps réel : l'admin voit les nouvelles commandes sans recharger.
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

-- ---------- Photos (Storage) ----------
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());
