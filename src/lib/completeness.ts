import { Product } from '@/lib/types';

export interface ProductCompleteness {
  score: number; // 0 - 100
  isComplete: boolean;
  missingFields: string[];
}

export function computeProductCompleteness(product: Product): ProductCompleteness {
  const missing: string[] = [];

  if (!product.name || !product.name.trim()) missing.push('Product Name');
  if (!product.sku || !product.sku.trim()) missing.push('Product SKU');
  if (!product.category_id) missing.push('Category');
  if (!product.brand_id) missing.push('Brand');
  if (!product.short_description || !product.short_description.trim()) missing.push('Short Description');
  if (!product.description || !product.description.trim()) missing.push('Description');
  if (!product.material || !product.material.trim()) missing.push('Material');
  if (!product.available_sizes || product.available_sizes.length === 0) missing.push('Sizes');
  if (!product.images || product.images.length === 0) missing.push('Photographs');
  if (!product.variants || product.variants.length === 0) missing.push('Colour Variants');
  if (!product.packaging_type_id) missing.push('Packaging Specification');

  const totalCriteria = 11;
  const fulfilled = totalCriteria - missing.length;
  const score = Math.round((fulfilled / totalCriteria) * 100);

  return {
    score,
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}
