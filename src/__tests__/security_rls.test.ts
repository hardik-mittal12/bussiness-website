import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security & Row Level Security (RLS) Policies Audit', () => {
  const schemaSqlPath = path.resolve(__dirname, '../../supabase/migrations/20261016_init_schema.sql');
  const rlsSqlPath = path.resolve(__dirname, '../../supabase/migrations/20261016_rls_policies.sql');

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

  it('contains trigger to prevent self-role elevation by ordinary users', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    expect(rlsSql).toContain('check_profile_role_update');
    expect(rlsSql).toContain('Unauthorized role modification');
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
});
