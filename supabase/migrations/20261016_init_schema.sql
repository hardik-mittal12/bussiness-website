-- Wholesale Footwear Database Initial Schema Migration
-- Designed for PostgreSQL / Supabase

-- Extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles & Authorization Roles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_display on public.categories(is_active, display_order);

-- 3. Brands
create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 4. Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  sku text unique,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  short_description text,
  description text,
  material text,
  available_sizes text[] not null default '{}',
  color text,
  wholesale_price numeric(10,2),
  price_visibility text not null default 'contact' check (price_visibility in ('public', 'contact', 'hidden')),
  moq int not null default 12,
  availability_status text not null default 'in_stock' check (availability_status in ('in_stock', 'made_to_order', 'low_stock', 'out_of_stock')),
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optimized indexes for fast catalog searches and SEO queries
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category_id) where status = 'published';
create index if not exists idx_products_featured on public.products(is_featured) where status = 'published';
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_created on public.products(created_at desc);

-- 5. Product Images
create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id, display_order);

-- 6. Business Settings (Single record with id = 'default')
create table if not exists public.business_settings (
  id text primary key default 'default',
  business_name text not null default 'Wholesale Footwear Business',
  tagline text,
  logo_url text,
  phone text,
  whatsapp_number text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  business_hours text,
  service_areas text[] not null default '{}',
  hero_headline text,
  hero_subheadline text,
  hero_image_url text,
  about_intro text,
  about_history text,
  about_strengths jsonb not null default '[]',
  wholesale_terms text,
  moq_policy text,
  shipping_info text,
  return_policy text,
  social_links jsonb not null default '{}',
  analytics_google_id text,
  updated_at timestamptz not null default now()
);

-- 7. Enquiries
create table if not exists public.enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  shop_name text,
  phone text not null,
  email text,
  city text not null,
  enquiry_type text not null default 'general' check (enquiry_type in ('general', 'product', 'catalogue', 'bulk_pricing')),
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  sku text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'converted', 'closed')),
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enquiries_status on public.enquiries(status, created_at desc);
create index if not exists idx_enquiries_date on public.enquiries(created_at desc);

-- 8. Enquiry Internal Notes (Admin only)
create table if not exists public.enquiry_notes (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_enquiry_notes_enquiry on public.enquiry_notes(enquiry_id, created_at desc);

-- 9. URL Redirect Mappings (for preserving SEO if slugs change)
create table if not exists public.redirect_mappings (
  id uuid primary key default uuid_generate_v4(),
  source_path text not null unique,
  target_path text not null,
  status_code int not null default 301,
  created_at timestamptz not null default now()
);

-- Trigger to update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger tr_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

create trigger tr_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.handle_updated_at();

create trigger tr_enquiries_updated_at
  before update on public.enquiries
  for each row execute function public.handle_updated_at();
