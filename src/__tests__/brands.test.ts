import { describe, it, expect } from 'vitest';
import { 
  getBrands, 
  getBrandById, 
  getBrandBySlug, 
  createBrand, 
  updateBrand, 
  deleteBrand,
  getProducts
} from '../lib/data-service';
import { brandSchema } from '../lib/validation';

describe('V2 Brand Management & Referential Integrity', () => {
  it('validates brand data schema correctly', () => {
    const valid = brandSchema.safeParse({
      name: 'UrbanSole Studio',
      slug: 'urbansole-studio',
      description: 'Contemporary casual sneakers',
      display_order: 1,
      is_active: true,
    });
    expect(valid.success).toBe(true);

    const invalid = brandSchema.safeParse({
      name: 'A', // too short
      slug: 'INVALID SLUG!', // uppercase & spaces
    });
    expect(invalid.success).toBe(false);
  });

  it('lists existing brands with product counts', async () => {
    const brands = await getBrands(true);
    expect(brands.length).toBeGreaterThan(0);
    const stridepro = brands.find((b) => b.slug === 'stridepro');
    expect(stridepro).toBeDefined();
    expect(typeof stridepro?.product_count).toBe('number');
  });

  it('creates and fetches a new brand', async () => {
    const newBrand = await createBrand({
      name: 'Stallion Boots',
      slug: `stallion-boots-${Date.now()}`,
      description: 'Heavy duty work and utility footwear',
      display_order: 10,
      is_active: true,
    });

    expect(newBrand.id).toBeDefined();
    expect(newBrand.name).toBe('Stallion Boots');

    const fetched = await getBrandById(newBrand.id);
    expect(fetched?.slug).toBe(newBrand.slug);

    const bySlug = await getBrandBySlug(newBrand.slug);
    expect(bySlug?.id).toBe(newBrand.id);
  });

  it('updates brand properties cleanly', async () => {
    const brand = await createBrand({
      name: 'Temp Brand',
      slug: `temp-brand-${Date.now()}`,
      display_order: 99,
      is_active: true,
    });

    const updated = await updateBrand(brand.id, {
      name: 'Updated Temp Brand',
      is_active: false,
    });

    expect(updated.name).toBe('Updated Temp Brand');
    expect(updated.is_active).toBe(false);
  });

  it('strictly prevents deletion of a brand with assigned products', async () => {
    const { products } = await getProducts({ status: 'all', limit: 10 });
    const productWithBrand = products.find((p) => p.brand_id);
    expect(productWithBrand).toBeDefined();

    const brandId = productWithBrand!.brand_id!;
    const deleteResult = await deleteBrand(brandId);

    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error).toContain('product(s) are currently assigned to this brand');
  });

  it('safely deletes a brand when zero products are assigned', async () => {
    const emptyBrand = await createBrand({
      name: 'Empty Brand For Deletion',
      slug: `empty-brand-${Date.now()}`,
      display_order: 50,
      is_active: true,
    });

    const deleteResult = await deleteBrand(emptyBrand.id);
    expect(deleteResult.success).toBe(true);

    const fetchedAfter = await getBrandById(emptyBrand.id);
    expect(fetchedAfter).toBeNull();
  });
});
