import { describe, it, expect } from 'vitest';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductById, 
  createCategory, 
  deleteCategory, 
  submitEnquiry, 
  updateEnquiryStatus, 
  addEnquiryNote, 
  getEnquiries, 
  updateBusinessSettings, 
  getBusinessSettings 
} from '../lib/data-service';

describe('Admin Operations & Data Mutations', () => {
  it('creates and updates a wholesale product', async () => {
    const newProduct = await createProduct({
      name: 'Test Loafer Executive',
      slug: `test-loafer-${Date.now()}`,
      sku: 'TST-LF-01',
      moq: 18,
      wholesale_price: 350,
      price_visibility: 'contact',
      status: 'draft',
      available_sizes: ['7', '8', '9'],
    });

    expect(newProduct.id).toBeDefined();
    expect(newProduct.name).toBe('Test Loafer Executive');
    expect(newProduct.status).toBe('draft');

    // Update product
    const updated = await updateProduct(newProduct.id, {
      wholesale_price: 380,
      status: 'published',
    });

    expect(updated.wholesale_price).toBe(380);
    expect(updated.status).toBe('published');

    // Cleanup
    await deleteProduct(newProduct.id);
    const lookup = await getProductById(newProduct.id);
    expect(lookup).toBeNull();
  });

  it('enforces dependency check when attempting to delete a category in use', async () => {
    // Category c2222222-2222-2222-2222-222222222222 is used by AeroRunner
    const result = await deleteCategory('c2222222-2222-2222-2222-222222222222');
    expect(result.success).toBe(false);
    expect(result.error).toContain('assigned to this category');
  });

  it('allows deleting an unreferenced category safely', async () => {
    const cat = await createCategory({
      name: 'Temporary Category',
      slug: `temp-cat-${Date.now()}`,
      description: null,
      image_url: null,
      display_order: 99,
      is_active: false,
    });

    const result = await deleteCategory(cat.id);
    expect(result.success).toBe(true);
  });

  it('manages enquiries, updates status, and appends internal notes', async () => {
    const enq = await submitEnquiry({
      name: 'Vikas Agarwal',
      shop_name: 'Agarwal Boot House',
      phone: '+91 97111 22334',
      email: 'agarwal@example.com',
      city: 'Kanpur',
      enquiry_type: 'bulk_pricing',
      product_id: null,
      product_name: null,
      sku: null,
      message: 'Looking for 15 cartons of formal shoes.',
    });

    expect(enq.status).toBe('new');

    // Advance status to 'contacted'
    const updated = await updateEnquiryStatus(enq.id, 'contacted', '2026-10-25');
    expect(updated.status).toBe('contacted');
    expect(updated.follow_up_date).toBe('2026-10-25');

    // Add private note
    await addEnquiryNote(enq.id, 'Spoke with Vikas on WhatsApp. Shared Kanpur bilty rates.');
    const list = await getEnquiries();
    const found = list.find((e) => e.id === enq.id);
    expect(found?.notes?.length).toBeGreaterThan(0);
    expect(found?.notes?.[0].note).toContain('Spoke with Vikas');
  });

  it('updates business information and terms without code changes', async () => {
    const original = await getBusinessSettings();
    const testTagline = `Updated Tagline ${Date.now()}`;

    await updateBusinessSettings({ tagline: testTagline });
    const fresh = await getBusinessSettings();
    expect(fresh.tagline).toBe(testTagline);

    // Restore
    await updateBusinessSettings({ tagline: original.tagline });
  });
});
