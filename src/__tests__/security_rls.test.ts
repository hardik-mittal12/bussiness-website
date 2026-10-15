import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security & Row Level Security (RLS) Policies Audit', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
  const findMigration = (name: string) => {
    const file = fs.readdirSync(migrationsDir).find(f => f.endsWith(name));
    return file ? path.join(migrationsDir, file) : '';
  };
  const schemaSqlPath = findMigration('init_schema.sql');
  const rlsSqlPath = findMigration('rls_policies.sql');

  it('verifies SQL schema and RLS migration files exist', () => {
    expect(fs.existsSync(schemaSqlPath)).toBe(true);
    expect(fs.existsSync(rlsSqlPath)).toBe(true);
  });

  it('enforces Row Level Security (RLS) on all production tables', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');

    const requiredTables = [
      'profiles',
      'categories',
      'brands',
      'products',
      'product_images',
      'business_settings',
      'enquiries',
      'enquiry_notes',
      'redirect_mappings',
    ];

    for (const table of requiredTables) {
      expect(rlsSql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it('contains security definer admin authorization function', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    expect(rlsSql).toContain('create or replace function public.is_admin()');
    expect(rlsSql).toContain('security definer');
    expect(rlsSql).toContain("role = 'admin'");
  });

  it('contains trigger to prevent self-role elevation by ordinary users on insert and update', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    expect(rlsSql).toContain('check_profile_role_guard');
    expect(rlsSql).toContain('Unauthorized role modification');
    expect(rlsSql).toContain('Unauthorized admin role creation');
  });

  it('verifies category foreign key uses ON DELETE RESTRICT to prevent orphaned product relations', () => {
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
    expect(schemaSql).toContain('category_id uuid references public.categories(id) on delete restrict');
  });

  it('restricts public product reads strictly to status = published', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    expect(rlsSql).toContain("status = 'published'");
  });

  it('ensures private enquiries and enquiry notes are inaccessible to anonymous users', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    // Enquiries select policy is strictly for authenticated admins
    expect(rlsSql).toContain('create policy "Admins can view and manage enquiries"');
    // Enquiry notes have NO public policy whatsoever
    expect(rlsSql).toContain('create policy "Admins can manage enquiry notes"');
    expect(rlsSql).not.toContain('create policy "Public can view enquiry notes"');
  });

  it('protects image storage buckets from unauthenticated writes', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    expect(rlsSql).toContain('create policy "Admins can upload product images"');
    expect(rlsSql).toContain('public.is_admin()');
  });

  it('audits V2 migration for RLS on packaging_types and product_variants and safe referential integrity', () => {
    const v2SqlPath = findMigration('v2_brands_variants_packaging.sql');
    expect(fs.existsSync(v2SqlPath)).toBe(true);
    const v2Sql = fs.readFileSync(v2SqlPath, 'utf-8');

    // RLS enabled
    expect(v2Sql).toContain('alter table public.packaging_types enable row level security;');
    expect(v2Sql).toContain('alter table public.product_variants enable row level security;');

    // Admin mutation checks
    expect(v2Sql).toContain('create policy "Admins can manage packaging types"');
    expect(v2Sql).toContain('create policy "Admins can manage product variants"');
    expect(v2Sql).toContain('create policy "Admins can manage brands"');

    // Public variants strictly limited to published products
    expect(v2Sql).toContain("p.status = 'published'");

    // Referential integrity
    expect(v2Sql).toContain('on delete restrict');
    expect(v2Sql).toContain('on delete set null');
  });
});
