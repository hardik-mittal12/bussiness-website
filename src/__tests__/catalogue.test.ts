import { describe, it, expect } from 'vitest';
import { getProducts, getProductBySlug, getCategories } from '../lib/data-service';

describe('Public Catalogue Sourcing & Filtering', () => {
  it('loads published products for public visitors', async () => {
    const { products, total } = await getProducts({ status: 'published' });
    expect(total).toBeGreaterThan(0);
    expect(products.every((p) => p.status === 'published')).toBe(true);
  });

  it('CRITICAL: Never exposes unpublished or draft products in public queries', async () => {
    const { products } = await getProducts({ status: 'published' });
    const draftItem = products.find((p) => p.status === 'draft');
    expect(draftItem).toBeUndefined();

    // Verify draft item directly by slug without includeUnpublished flag
    const publicFetch = await getProductBySlug('seasonal-winter-ankle-boot-sample', false);
    expect(publicFetch).toBeNull();

    // Admin fetch with includeUnpublished = true should see it
    const adminFetch = await getProductBySlug('seasonal-winter-ankle-boot-sample', true);
    expect(adminFetch).not.toBeNull();
    expect(adminFetch?.status).toBe('draft');
  });

  it('filters products by category slug accurately', async () => {
    const { products } = await getProducts({
      categorySlug: 'mens-sports',
      status: 'published',
    });

    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.category?.slug === 'mens-sports')).toBe(true);
  });

  it('searches products by SKU or product name case-insensitively', async () => {
    // Search by SKU: SP-RUN-01
    const skuResult = await getProducts({
      searchQuery: 'sp-run',
      status: 'published',
    });
    expect(skuResult.products.some((p) => p.sku === 'SP-RUN-01')).toBe(true);

    // Search by partial name: oxford
    const nameResult = await getProducts({
      searchQuery: 'oxford',
      status: 'published',
    });
    expect(nameResult.products.some((p) => p.name.includes('Oxford'))).toBe(true);
  });

  it('returns valid single product by slug with category and images', async () => {
    const product = await getProductBySlug('aerorunner-mesh-trainer-pro');
    expect(product).not.toBeNull();
    expect(product?.name).toBe('AeroRunner Mesh Trainer Pro');
    expect(product?.images.length).toBeGreaterThan(0);
    expect(product?.moq).toBe(12);
  });

  it('returns null for nonexistent product slug', async () => {
    const product = await getProductBySlug('non-existent-product-slug-xyz');
    expect(product).toBeNull();
  });
});
