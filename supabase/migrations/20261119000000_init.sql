-- ============================================================================
-- Nicolini Import starter · esquema inicial
-- Ejecutar en un proyecto de Supabase nuevo (SQL Editor o supabase db push).
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  create type public.product_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique,
  description text not null default '',
  sku text not null unique check (char_length(trim(sku)) between 2 and 40),
  category_id uuid not null references public.categories (id) on delete restrict,
  price numeric(12, 2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  store_name text not null default 'Nicolini Import',
  logo_url text,
  brand_color text not null default '#c9f26b' check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  whatsapp text not null default '5491100000000',
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 1),
  currency text not null default 'ARS',
  locale text not null default 'es-AR',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_sku_trgm_idx on public.products using gin (sku gin_trgm_ops);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Autorización
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

-- Categories: lectura pública, escritura solo admin.
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories
  for delete to authenticated using (public.is_admin());

-- Products: el público solo ve publicados; el admin ve todo.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (status = 'published');

drop policy if exists "products_admin_read" on public.products;
create policy "products_admin_read" on public.products
  for select to authenticated using (public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

-- Product images: visibles si el producto está publicado.
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and products.status = 'published'
    )
  );

drop policy if exists "product_images_admin_read" on public.product_images;
create policy "product_images_admin_read" on public.product_images
  for select to authenticated using (public.is_admin());

drop policy if exists "product_images_admin_insert" on public.product_images;
create policy "product_images_admin_insert" on public.product_images
  for insert to authenticated with check (public.is_admin());

drop policy if exists "product_images_admin_update" on public.product_images;
create policy "product_images_admin_update" on public.product_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_images_admin_delete" on public.product_images;
create policy "product_images_admin_delete" on public.product_images
  for delete to authenticated using (public.is_admin());

-- Settings: lectura pública, edición solo admin.
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_admin_insert" on public.site_settings;
create policy "site_settings_admin_insert" on public.site_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin users: cada usuario solo puede leer su propia fila.
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users
  for select to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (RLS sigue filtrando filas)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.products, public.categories, public.product_images, public.site_settings to anon;
grant select, insert, update, delete on public.products, public.categories, public.product_images to authenticated;
grant select, insert, update on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: fotos de productos y logo de marca
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_storage_public_read" on storage.objects;
create policy "product_images_storage_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_storage_admin_insert" on storage.objects;
create policy "product_images_storage_admin_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and public.is_admin()
  );

drop policy if exists "product_images_storage_admin_update" on storage.objects;
create policy "product_images_storage_admin_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images' and public.is_admin()
  ) with check (
    bucket_id = 'product-images' and public.is_admin()
  );

drop policy if exists "product_images_storage_admin_delete" on storage.objects;
create policy "product_images_storage_admin_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Configuración inicial (ARS + español de Argentina)
-- ---------------------------------------------------------------------------

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;
