-- Wholesale Footwear Row Level Security (RLS) & Access Control
-- Secure Policies for Anonymous visitors vs Authenticated Administrators

-- Helper function to check if the current user is an authorized admin
create or replace function public.is_admin()
returns boolean
security definer
set search_path = public
language plpgsql as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.business_settings enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.redirect_mappings enable row level security;

-- 1. Profiles Policies
-- Admins can view and manage all profiles
create policy "Admins can manage all profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Users can view their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Prevent non-admins from updating their own role
create or replace function public.check_profile_role_update()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Unauthorized role modification';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tr_check_profile_role
  before update on public.profiles
  for each row execute function public.check_profile_role_update();

-- 2. Categories Policies
-- Public can view active categories
create policy "Public can view active categories"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

-- Admins can manage categories
create policy "Admins can manage categories"
  on public.categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Brands Policies
-- Public can view brands
create policy "Public can view brands"
  on public.brands
  for select
  to anon, authenticated
  using (true);

-- Admins can manage brands
create policy "Admins can manage brands"
  on public.brands
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Products Policies
-- Public can ONLY view published products
create policy "Public can view published products"
  on public.products
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

-- Admins can perform any action on products
create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Product Images Policies
-- Public can view images belonging to published products
create policy "Public can view images of published products"
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and (products.status = 'published' or public.is_admin())
    )
  );

-- Admins can manage all product images
create policy "Admins can manage product images"
  on public.product_images
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Business Settings Policies
-- Public can view business settings
create policy "Public can view business settings"
  on public.business_settings
  for select
  to anon, authenticated
  using (true);

-- Admins can update business settings
create policy "Admins can update business settings"
  on public.business_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Enquiries Policies
-- Public / Visitors can submit enquiries
create policy "Anyone can submit enquiry"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

-- Only Admins can view, update, or delete enquiries
create policy "Admins can view and manage enquiries"
  on public.enquiries
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update enquiries"
  on public.enquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete enquiries"
  on public.enquiries
  for delete
  to authenticated
  using (public.is_admin());

-- 8. Enquiry Internal Notes Policies (Strictly Admin only)
create policy "Admins can manage enquiry notes"
  on public.enquiry_notes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 9. Redirect Mappings Policies
create policy "Public can view redirect mappings"
  on public.redirect_mappings
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage redirect mappings"
  on public.redirect_mappings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage Bucket Setup & Policies
insert into storage.buckets (id, name, public)
values 
  ('product-images', 'product-images', true),
  ('business-assets', 'business-assets', true)
on conflict (id) do update set public = true;

-- Storage Objects Policies
create policy "Public can view product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('product-images', 'business-assets'));

create policy "Admins can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('product-images', 'business-assets')
    and public.is_admin()
  );

create policy "Admins can update product images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('product-images', 'business-assets')
    and public.is_admin()
  );

create policy "Admins can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('product-images', 'business-assets')
    and public.is_admin()
  );
