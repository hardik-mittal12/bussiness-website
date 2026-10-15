import { describe, it, expect } from 'vitest';
import { 
  getPackagingTypes, 
  getPackagingTypeById, 
  createPackagingType, 
  updatePackagingType, 
  deletePackagingType,
  createProduct,
  getProductById,
  deleteProduct
} from '../lib/data-service';
import { packagingTypeSchema } from '../lib/validation';

describe('V2 Configurable Packaging & Carton System', () => {
  it('validates packagingTypeSchema correctly', () => {
    const valid = packagingTypeSchema.safeParse({
      name: 'Loose Polybag / Bulk Bag',
      slug: 'loose-polybag',
      description: 'Individual moisture-proof polybags inside heavy duty carton',
      display_order: 2,
      is_active: true,
      is_default: false,
    });
    expect(valid.success).toBe(true);

    const invalid = packagingTypeSchema.safeParse({
      name: '',
      slug: 'Invalid Slug!',
    });
    expect(invalid.success).toBe(false);
  });

  it('lists seeded packaging formats (Master Carton, Polybag, Box, Bundle)', async () => {
    const types = await getPackagingTypes(true);
    expect(types.length).toBeGreaterThanOrEqual(4);
    
    const names = types.map((t) => t.name.toLowerCase());
    expect(names.some((n) => n.includes('carton'))).toBe(true);
    expect(names.some((n) => n.includes('polybag'))).toBe(true);
  });

  it('creates and updates a custom wholesale packaging format', async () => {
    const created = await createPackagingType({
      name: 'Export Wooden Crate',
      slug: `export-crate-${Date.now()}`,
      description: 'Reinforced wood crate for long distance ocean/rail freight',
      display_order: 10,
      is_active: true,
      is_default: false,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Export Wooden Crate');

    const updated = await updatePackagingType(created.id, {
      description: 'Reinforced treated wood crate',
    });
    expect(updated.description).toBe('Reinforced treated wood crate');

    const fetched = await getPackagingTypeById(created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it('allows configuring product with non-box packaging (e.g. Polybag, 36 pairs/carton)', async () => {
    const types = await getPackagingTypes(true);
    const polybag = types.find((t) => t.slug === 'polybag-bulk') || types[1];

    const prod = await createProduct({
      name: 'Budget EVA Clogs',
      slug: `eva-clogs-${Date.now()}`,
      moq: 36,
      packaging_type_id: polybag.id,
      packaging_pairs_per_carton: 36,
      packaging_units_per_package: 1,
      carton_dimensions: '65 x 45 x 40 cm',
      carton_weight: '9.5 kg',
      carton_size_assortment: 'Size 6: 6 | Size 7: 9 | Size 8: 9 | Size 9: 6 | Size 10: 6',
      packaging_included_in_price: true,
    });

    const fetched = await getProductById(prod.id);
    expect(fetched?.packaging_type_id).toBe(polybag.id);
    expect(fetched?.packaging_type?.name).toBe(polybag.name);
    expect(fetched?.packaging_pairs_per_carton).toBe(36);
    expect(fetched?.carton_size_assortment).toContain('Size 6: 6');
    expect(fetched?.packaging_included_in_price).toBe(true);

    // Clean up
    await deleteProduct(prod.id);
  });

  it('restricts deleting packaging type if assigned to active products', async () => {
    const pkg = await createPackagingType({
      name: 'Temp Test Packaging',
      slug: `temp-pkg-${Date.now()}`,
    });

    // Assign to product
    const prod = await createProduct({
      name: 'Product with Temp Pkg',
      slug: `prod-temp-pkg-${Date.now()}`,
      packaging_type_id: pkg.id,
    });

    // Deletion must be rejected
    const deleteAttempt = await deletePackagingType(pkg.id);
    expect(deleteAttempt.success).toBe(false);
    expect(deleteAttempt.error).toContain('product(s) are currently configured with this packaging type');

    // Clean up product first
    await deleteProduct(prod.id);

    // Now deletion must succeed
    const deleteSuccess = await deletePackagingType(pkg.id);
    expect(deleteSuccess.success).toBe(true);
  });
});
