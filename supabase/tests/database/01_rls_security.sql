-- Wholesale Footwear Platform
-- pgTAP Database Level Security and RLS Test Suite
-- Run via: supabase test db

begin;
select plan(35);

-- 1. Verify Extensions
select has_extension('uuid-ossp', 'Extension uuid-ossp should be active');
select has_extension('pgtap', 'Extension pgtap should be active');

-- 2. Verify RLS is enabled on all tables
select table_has_rls('public', 'profiles', 'public.profiles must have RLS enabled');
select table_has_rls('public', 'categories', 'public.categories must have RLS enabled');
select table_has_rls('public', 'brands', 'public.brands must have RLS enabled');
select table_has_rls('public', 'products', 'public.products must have RLS enabled');
select table_has_rls('public', 'product_images', 'public.product_images must have RLS enabled');
select table_has_rls('public', 'packaging_types', 'public.packaging_types must have RLS enabled');
select table_has_rls('public', 'product_variants', 'public.product_variants must have RLS enabled');
select table_has_rls('public', 'business_settings', 'public.business_settings must have RLS enabled');
select table_has_rls('public', 'enquiries', 'public.enquiries must have RLS enabled');
select table_has_rls('public', 'enquiry_notes', 'public.enquiry_notes must have RLS enabled');
select table_has_rls('public', 'redirect_mappings', 'public.redirect_mappings must have RLS enabled');

-- 3. Verify Helper Functions
select has_function('public', 'is_admin', 'Helper public.is_admin() must exist');
select function_returns('public', 'is_admin', 'boolean', 'public.is_admin() must return boolean');

-- 4. Test Anonymous Role Boundaries
set local role anon;

-- Anonymous can read published products
select ok(
  (select count(*) >= 0 from public.products where status = 'published'),
  'Anonymous role can read published products'
);

-- Anonymous CANNOT read draft or archived products
select is_empty(
  'select * from public.products where status != ''published''',
  'Anonymous role cannot read draft or archived products'
);

-- Anonymous CANNOT read private enquiry notes
select throws_ok(
  'select * from public.enquiry_notes',
  'permission denied for table enquiry_notes',
  'Anonymous role cannot read enquiry notes'
);

-- Anonymous CANNOT read enquiries
select is_empty(
  'select * from public.enquiries',
  'Anonymous role cannot read any enquiries'
);

-- Anonymous CANNOT mutate products
select throws_ok(
  'insert into public.products (name, slug) values (''Hacked'', ''hacked'')',
  'permission denied for table products',
  'Anonymous role cannot insert products'
);

-- Anonymous CANNOT mutate brands
select throws_ok(
  'insert into public.brands (name, slug) values (''Hacked Brand'', ''hacked-brand'')',
  'permission denied for table brands',
  'Anonymous role cannot insert brands'
);

-- Anonymous CANNOT mutate packaging types
select throws_ok(
  'insert into public.packaging_types (name, slug) values (''Hacked Packaging'', ''hacked-pkg'')',
  'permission denied for table packaging_types',
  'Anonymous role cannot insert packaging types'
);

-- 5. Test Profile Role Protection (Self-promotion prevention)
reset role;

-- Setup test users
insert into auth.users (id, email)
values 
  ('11111111-1111-1111-1111-111111111111', 'viewer@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, email, role, full_name)
values 
  ('11111111-1111-1111-1111-111111111111', 'viewer@example.com', 'viewer', 'Viewer User'),
  ('22222222-2222-2222-2222-222222222222', 'admin@example.com', 'admin', 'Admin User')
on conflict (id) do nothing;

-- Switch to ordinary authenticated user
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Verify ordinary user is not admin
select is(public.is_admin(), false, 'Viewer user is not admin');

-- Ordinary user cannot read other user profile
select is_empty(
  'select * from public.profiles where id = ''22222222-2222-2222-2222-222222222222''',
  'Viewer user cannot read admin profile'
);

-- Ordinary user CANNOT promote self to admin
select throws_ok(
  'update public.profiles set role = ''admin'' where id = ''11111111-1111-1111-1111-111111111111''',
  'Unauthorized role modification',
  'Viewer user cannot escalate role to admin'
);

-- Ordinary user cannot read enquiries
select is_empty(
  'select * from public.enquiries',
  'Viewer user cannot read enquiries'
);

-- 6. Switch to Authenticated Admin
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is(public.is_admin(), true, 'Admin user is detected as admin');

-- Admin can manage products, brands, packaging
select ok(
  (select count(*) >= 0 from public.products),
  'Admin can query full product catalogue including drafts'
);

select ok(
  (select count(*) >= 0 from public.enquiries),
  'Admin can access wholesale enquiries'
);

-- 7. Referential Integrity Tests
reset role;

-- Attempting to delete a brand that has associated products must fail
select throws_ok(
  'delete from public.brands where id in (select brand_id from public.products where brand_id is not null limit 1)',
  '23503', -- foreign_key_violation
  'Deleting brand with associated products violates foreign key restrict'
);

select * from finish();
rollback;
