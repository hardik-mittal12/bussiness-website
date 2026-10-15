import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  submitEnquiry, 
  updateEnquiryStatus, 
  addEnquiryNote, 
  deleteEnquiry, 
  updateBusinessSettings 
} from '../lib/data-service';
import { getAdminSession } from '../lib/auth';

describe('Fail-Closed Production Guarantees & Auth Hardening', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Simulate production environment
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it('strictly rejects dev admin session in production mode', async () => {
    const session = await getAdminSession();
    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
  });

  it('rejects product creation in production without Supabase connection', async () => {
    await expect(
      createProduct({
        name: 'Production Test Shoe',
        slug: 'prod-test-shoe',
      })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects product updates in production without Supabase connection', async () => {
    await expect(
      updateProduct('test-id', {
        name: 'Updated Name',
      })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects product deletion in production without Supabase connection', async () => {
    await expect(
      deleteProduct('test-id')
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects category creation in production without Supabase connection', async () => {
    await expect(
      createCategory({
        name: 'New Category',
        slug: 'new-cat',
        description: null,
        image_url: null,
        display_order: 1,
        is_active: true,
      })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects category update in production without Supabase connection', async () => {
    await expect(
      updateCategory('test-cat-id', {
        name: 'New Category Name',
      })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects category deletion in production without Supabase connection', async () => {
    await expect(
      deleteCategory('test-cat-id')
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects enquiry submission in production without Supabase connection (no silent drop)', async () => {
    await expect(
      submitEnquiry({
        name: 'Buyer',
        shop_name: 'Shop',
        phone: '+91 99999 88888',
        email: 'buyer@example.com',
        city: 'Delhi',
        enquiry_type: 'general',
        product_id: null,
        product_name: null,
        sku: null,
        message: 'Wholesale enquiry',
      })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects enquiry status updates in production without Supabase connection', async () => {
    await expect(
      updateEnquiryStatus('test-enq-id', 'in_progress')
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects enquiry notes creation in production without Supabase connection', async () => {
    await expect(
      addEnquiryNote('test-enq-id', 'Test Note')
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects enquiry deletion in production without Supabase connection', async () => {
    await expect(
      deleteEnquiry('test-enq-id')
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });

  it('rejects business settings updates in production without Supabase connection', async () => {
    await expect(
      updateBusinessSettings({ business_name: 'Hacked Name' })
    ).rejects.toThrow(/Persistent Supabase database connection is not configured/);
  });
});
