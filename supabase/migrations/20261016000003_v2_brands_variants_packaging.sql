-- Wholesale Footwear Database V2 Migration
-- Brand Management, Colour Variants, and Configurable Packaging

create extension if not exists "uuid-ossp";

-- 1. Enhance Brands Table
alter table public.brands add column if not exists logo_url text;
alter table public.brands add column if not exists display_order int not null default 0;
alter table public.brands add column if not exists is_active boolean not null default true;
alter table public.brands add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_brands_slug on public.brands(slug);
create index if not exists idx_brands_display on public.brands(is_active, display_order);

-- Strengthen referential integrity: prevent deleting brands that have associated products
alter table public.products drop constraint if exists products_brand_id_fkey;
alter table public.products add constraint products_brand_id_fkey foreign key (brand_id) references public.brands(id) on delete restrict;

-- 2. Packaging Types Table
create table if not exists public.packaging_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packaging_slug on public.packaging_types(slug);
create index if not exists idx_packaging_display on public.packaging_types(is_active, display_order);

-- 3. Product Variants (Colours)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  colour_name text not null,
  colour_family text,
  hex_code text,
  pattern text,
  variant_sku text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product on public.product_variants(product_id, display_order);
create index if not exists idx_product_variants_active on public.product_variants(is_active);

-- 4. Extend Product Images to link to Colour Variants
alter table public.product_images add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
create index if not exists idx_product_images_variant on public.product_images(variant_id);

-- 5. Extend Products Table with Packaging Configuration
alter table public.products add column if not exists packaging_type_id uuid references public.packaging_types(id) on delete set null;
alter table public.products add column if not exists packaging_pairs_per_carton int;
alter table public.products add column if not exists packaging_units_per_package int;
alter table public.products add column if not exists carton_dimensions text;
alter table public.products add column if not exists carton_weight text;
alter table public.products add column if not exists carton_size_assortment text;
alter table public.products add column if not exists packaging_included_in_price boolean not null default true;
alter table public.products add column if not exists packaging_notes text;

create index if not exists idx_products_packaging on public.products(packaging_type_id);
create index if not exists idx_products_brand_id on public.products(brand_id);

-- 6. Row Level Security for New & Updated Tables
alter table public.packaging_types enable row level security;
alter table public.product_variants enable row level security;

-- Brands RLS: Active brands public, admins full access
drop policy if exists "Public can view brands" on public.brands;
drop policy if exists "Anyone can view brands" on public.brands;
drop policy if exists "Anyone can view active brands" on public.brands;
create policy "Anyone can view active brands"
  on public.brands for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Packaging Types RLS
drop policy if exists "Anyone can view active packaging types" on public.packaging_types;
create policy "Anyone can view active packaging types"
  on public.packaging_types for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage packaging types" on public.packaging_types;
create policy "Admins can manage packaging types"
  on public.packaging_types for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Product Variants RLS
drop policy if exists "Anyone can view active variants of published products" on public.product_variants;
create policy "Anyone can view active variants of published products"
  on public.product_variants for select
  to anon, authenticated
  using (
    public.is_admin() or (
      is_active = true and exists (
        select 1 from public.products p
        where p.id = product_variants.product_id and p.status = 'published'
      )
    )
  );

drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
  on public.product_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Least-Privilege Role Grants
grant select on public.brands to anon, authenticated;
grant all on public.brands to authenticated;

grant select on public.packaging_types to anon, authenticated;
grant all on public.packaging_types to authenticated;

grant select on public.product_variants to anon, authenticated;
grant all on public.product_variants to authenticated;

-- 7. Seed Initial Packaging Types if none exist
insert into public.packaging_types (id, name, slug, description, display_order, is_active, is_default)
values
  ('a1111111-1111-1111-1111-111111111111', 'Master Carton (12 Pairs)', 'master-carton-12', 'Standard 12-pair master corrugated carton with pre-sorted retail size curve.', 1, true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Master Carton (24 Pairs)', 'master-carton-24', 'High-volume 24-pair master carton for fast-moving slippers and sports articles.', 2, true, false),
  ('a3333333-3333-3333-3333-333333333333', 'Individual Shoe Box in Carton', 'individual-shoe-box', 'Each pair packed in an individual branded shoe box, bundled inside a master carton.', 3, true, false),
  ('a4444444-4444-4444-4444-444444444444', 'Polybag Loose Pack', 'polybag-loose-pack', 'Individual transparent polybags packed compactly in master bale/carton.', 4, true, false)
on conflict (slug) do nothing;
