-- Optimize RLS Policies: Separate Read vs Write actions to resolve Supabase Advisor lint 0006

-- 1. Brands
drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can insert brands" on public.brands for insert to authenticated with check (public.is_admin());
create policy "Admins can update brands" on public.brands for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete brands" on public.brands for delete to authenticated using (public.is_admin());

-- 2. Packaging Types
drop policy if exists "Admins can manage packaging types" on public.packaging_types;
create policy "Admins can insert packaging types" on public.packaging_types for insert to authenticated with check (public.is_admin());
create policy "Admins can update packaging types" on public.packaging_types for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete packaging types" on public.packaging_types for delete to authenticated using (public.is_admin());

-- 3. Categories
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can insert categories" on public.categories for insert to authenticated with check (public.is_admin());
create policy "Admins can update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete categories" on public.categories for delete to authenticated using (public.is_admin());

-- 4. Products
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins can update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete products" on public.products for delete to authenticated using (public.is_admin());

-- 5. Product Images
drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can insert product images" on public.product_images for insert to authenticated with check (public.is_admin());
create policy "Admins can update product images" on public.product_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete product images" on public.product_images for delete to authenticated using (public.is_admin());

-- 6. Product Variants
drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can insert product variants" on public.product_variants for insert to authenticated with check (public.is_admin());
create policy "Admins can update product variants" on public.product_variants for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete product variants" on public.product_variants for delete to authenticated using (public.is_admin());

-- 7. Business Settings
drop policy if exists "Admins can update business settings" on public.business_settings;
create policy "Admins can update business settings" on public.business_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8. Redirect Mappings
drop policy if exists "Admins can manage redirect mappings" on public.redirect_mappings;
create policy "Admins can insert redirect mappings" on public.redirect_mappings for insert to authenticated with check (public.is_admin());
create policy "Admins can update redirect mappings" on public.redirect_mappings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete redirect mappings" on public.redirect_mappings for delete to authenticated using (public.is_admin());

-- 9. Profiles
drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Admins can update all profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete profiles" on public.profiles for delete to authenticated using (public.is_admin());
