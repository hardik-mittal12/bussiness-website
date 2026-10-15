import { describe, it, expect } from 'vitest';
import { 
  createProduct, 
  getProductById, 
  updateProduct,
  deleteProduct
} from '../lib/data-service';
import { productVariantSchema } from '../lib/validation';
import { generateProductWhatsAppUrl } from '../lib/whatsapp';

describe('V2 Colour Variants & Image Mapping', () => {
  it('validates productVariantSchema with hex color code regex', () => {
    const valid = productVariantSchema.safeParse({
      colour_name: 'Mahogany Brown',
      colour_family: 'Brown',
      hex_code: '#8B4513',
      pattern: 'Textured Grain',
      variant_sku: 'APX-701-MAH',
      display_order: 1,
      is_active: true,
    });
    expect(valid.success).toBe(true);

    const invalidHex = productVariantSchema.safeParse({
      colour_name: 'Test',
      hex_code: 'NOT-A-HEX',
    });
    expect(invalidHex.success).toBe(false);
  });

  it('creates a product with multiple independently managed colourways', async () => {
    const created = await createProduct({
      name: 'Executive Derby Shoe',
      slug: `exec-derby-${Date.now()}`,
      moq: 12,
      wholesale_price: 1150,
      variants: [
        {
          colour_name: 'Jet Black',
          colour_family: 'Black',
          hex_code: '#111827',
          pattern: 'Smooth Polish',
          variant_sku: 'DERBY-BLK',
          display_order: 0,
          is_active: true,
        },
        {
          colour_name: 'Rich Tan',
          colour_family: 'Tan',
          hex_code: '#D2B48C',
          pattern: 'Natural Milled',
          variant_sku: 'DERBY-TAN',
          display_order: 1,
          is_active: true,
        },
      ],
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          alt_text: 'Jet Black Derby',
          is_primary: true,
        },
      ],
    });

    expect(created.variants).toHaveLength(2);
    expect(created.variants![0].colour_name).toBe('Jet Black');
    expect(created.variants![0].hex_code).toBe('#111827');
    expect(created.variants![1].colour_name).toBe('Rich Tan');

    const fetched = await getProductById(created.id);
    expect(fetched?.variants).toHaveLength(2);
    expect(fetched?.variants![1].variant_sku).toBe('DERBY-TAN');

    // Clean up
    await deleteProduct(created.id);
  });

  it('updates colourways and assigns variant_id to product photos', async () => {
    const prod = await createProduct({
      name: 'Multi-Colour Sneaker',
      slug: `mc-sneaker-${Date.now()}`,
      moq: 24,
      variants: [
        {
          colour_name: 'Triple White',
          hex_code: '#FFFFFF',
          variant_sku: 'SNK-WHT',
        },
      ],
    });

    const whiteVariantId = prod.variants![0].id;

    const updated = await updateProduct(prod.id, {
      variants: [
        ...prod.variants!,
        {
          colour_name: 'Midnight Navy',
          hex_code: '#1E3A8A',
          variant_sku: 'SNK-NVY',
        },
      ],
      images: [
        {
          variant_id: whiteVariantId,
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          alt_text: 'Triple White Photo',
          is_primary: true,
        },
      ],
    });

    expect(updated.variants).toHaveLength(2);
    expect(updated.images[0].variant_id).toBe(whiteVariantId);

    // Clean up
    await deleteProduct(prod.id);
  });

  it('generates WhatsApp enquiry URL with specific colourway and SKU', () => {
    const url = generateProductWhatsAppUrl({
      phoneNumber: '919876543210',
      productName: 'Royal Brogue',
      sku: 'BROGUE-01',
      colourName: 'Burgundy Cherry',
      variantSku: 'BROGUE-01-BUR',
      cartonQuantity: 12,
      packagingTypeName: 'Master Carton',
    });

    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Royal Brogue');
    expect(decoded).toContain('Burgundy Cherry');
    expect(decoded).toContain('BROGUE-01-BUR');
    expect(decoded).toContain('Master Carton');
    expect(decoded).toContain('12 pairs/carton');
  });
});
