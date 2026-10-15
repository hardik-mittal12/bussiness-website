import { describe, it, expect } from 'vitest';
import { 
  createProduct, 
  getProductById, 
  deleteProduct,
  duplicateProduct,
  bulkUpdateProductStatus,
  bulkAssignCategory,
  bulkDeleteProducts,
  computeProductCompleteness,
  getCategories
} from '../lib/data-service';

describe('V2 Bulk Operations, Duplication & Completeness Checks', () => {
  it('computes product completeness score accurately', async () => {
    const incompleteProduct = await createProduct({
      name: 'Incomplete Test Shoe',
      slug: `incomplete-${Date.now()}`,
      moq: 12,
    });

    const scoreIncomplete = computeProductCompleteness(incompleteProduct);
    expect(scoreIncomplete.isComplete).toBe(false);
    expect(scoreIncomplete.score).toBeLessThan(70);
    expect(scoreIncomplete.missingFields).toContain('Category');
    expect(scoreIncomplete.missingFields).toContain('Brand');
    expect(scoreIncomplete.missingFields).toContain('Packaging Specification');

    // Clean up
    await deleteProduct(incompleteProduct.id);
  });

  it('duplicates product with variants and images as a draft', async () => {
    const original = await createProduct({
      name: 'Signature Loafer',
      slug: `sig-loafer-${Date.now()}`,
      sku: 'SIG-LOAF',
      moq: 12,
      wholesale_price: 950,
      status: 'published',
      variants: [
        {
          colour_name: 'Chestnut',
          hex_code: '#954535',
          variant_sku: 'SIG-LOAF-CH',
        },
      ],
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          is_primary: true,
        },
      ],
    });

    const copy = await duplicateProduct(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Signature Loafer (Copy)');
    expect(copy.status).toBe('draft');
    expect(copy.variants).toHaveLength(1);
    expect(copy.variants![0].colour_name).toBe('Chestnut');
    expect(copy.variants![0].variant_sku).toBe('SIG-LOAF-CH-COPY');
    expect(copy.images).toHaveLength(1);

    // Clean up
    await deleteProduct(original.id);
    await deleteProduct(copy.id);
  });

  it('performs bulk status update across multiple products', async () => {
    const p1 = await createProduct({ name: 'Bulk Test 1', slug: `b1-${Date.now()}`, status: 'draft' });
    const p2 = await createProduct({ name: 'Bulk Test 2', slug: `b2-${Date.now()}`, status: 'draft' });

    const result = await bulkUpdateProductStatus([p1.id, p2.id], 'published');
    expect(result.updatedCount).toBe(2);

    const f1 = await getProductById(p1.id);
    const f2 = await getProductById(p2.id);
    expect(f1?.status).toBe('published');
    expect(f2?.status).toBe('published');

    // Bulk Delete
    const deleteRes = await bulkDeleteProducts([p1.id, p2.id]);
    expect(deleteRes.deletedCount).toBe(2);

    const afterF1 = await getProductById(p1.id);
    expect(afterF1).toBeNull();
  });

  it('performs bulk category assignment across products', async () => {
    const cats = await getCategories(true);
    expect(cats.length).toBeGreaterThan(0);
    const targetCat = cats[0];

    const p = await createProduct({ name: 'Cat Test', slug: `cattest-${Date.now()}`, category_id: null });
    expect(p.category_id).toBeNull();

    const assignResult = await bulkAssignCategory([p.id], targetCat.id);
    expect(assignResult.updatedCount).toBe(1);

    const updated = await getProductById(p.id);
    expect(updated?.category_id).toBe(targetCat.id);

    // Clean up
    await deleteProduct(p.id);
  });
});
