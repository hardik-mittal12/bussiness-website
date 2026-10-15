import { z } from 'zod';

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  shop_name: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().min(8, 'Please enter a valid phone number').max(20)
    .regex(/^[\d\s+\-()]+$/, 'Phone number contains invalid characters'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required').max(100),
  enquiry_type: z.enum(['general', 'product', 'catalogue', 'bulk_pricing']).default('general'),
  product_id: z.string().uuid().optional().nullable().or(z.literal('')),
  product_name: z.string().optional().nullable().or(z.literal('')),
  sku: z.string().optional().nullable().or(z.literal('')),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
  // Honeypot field for bot/spam prevention - must be empty
  website_hp: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
});

export type EnquiryFormData = z.infer<typeof enquirySchema>;

export const productVariantSchema = z.object({
  id: z.string().optional().nullable().or(z.literal('')),
  product_id: z.string().optional().nullable().or(z.literal('')),
  colour_name: z.string().trim().min(1, 'Colour name is required').max(80),
  colour_family: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  hex_code: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code (e.g. #000000)').optional().nullable().or(z.literal('')),
  pattern: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  variant_sku: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(150),
  slug: z.string().trim().min(2, 'Slug is required').max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  sku: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  category_id: z.string().uuid('Valid category is required').optional().nullable().or(z.literal('')),
  brand_id: z.string().uuid().optional().nullable().or(z.literal('')),
  short_description: z.string().trim().max(300).optional().nullable().or(z.literal('')),
  description: z.string().trim().max(5000).optional().nullable().or(z.literal('')),
  material: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  available_sizes: z.array(z.string()).default([]),
  color: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  wholesale_price: z.number().nonnegative().optional().nullable(),
  price_visibility: z.enum(['public', 'contact', 'hidden']).default('contact'),
  moq: z.number().int().min(1, 'MOQ must be at least 1').default(12),
  availability_status: z.enum(['in_stock', 'made_to_order', 'low_stock', 'out_of_stock']).default('in_stock'),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo_title: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  seo_description: z.string().trim().max(250).optional().nullable().or(z.literal('')),
  variants: z.array(productVariantSchema).optional().default([]),
  packaging_type_id: z.string().uuid().optional().nullable().or(z.literal('')),
  packaging_pairs_per_carton: z.number().int().positive().optional().nullable(),
  packaging_units_per_package: z.number().int().positive().optional().nullable(),
  carton_dimensions: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  carton_weight: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  carton_size_assortment: z.string().trim().max(250).optional().nullable().or(z.literal('')),
  packaging_included_in_price: z.boolean().default(true),
  packaging_notes: z.string().trim().max(500).optional().nullable().or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const brandSchema = z.object({
  name: z.string().trim().min(2, 'Brand name is required').max(100),
  slug: z.string().trim().min(2, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  logo_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type BrandFormData = z.infer<typeof brandSchema>;

export const packagingTypeSchema = z.object({
  name: z.string().trim().min(2, 'Packaging type name is required').max(100),
  slug: z.string().trim().min(2, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  image_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export type PackagingTypeFormData = z.infer<typeof packagingTypeSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(100),
  slug: z.string().trim().min(2, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  image_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const businessSettingsSchema = z.object({
  business_name: z.string().trim().min(2, 'Business name is required').max(150),
  tagline: z.string().trim().max(200).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  whatsapp_number: z.string().trim().max(25).optional().nullable().or(z.literal('')),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  address: z.string().trim().max(300).optional().nullable().or(z.literal('')),
  city: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  state: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  pincode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  business_hours: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  service_areas: z.array(z.string()).default([]),
  hero_headline: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  hero_subheadline: z.string().trim().max(300).optional().nullable().or(z.literal('')),
  about_intro: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  about_history: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  wholesale_terms: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  moq_policy: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  shipping_info: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  return_policy: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  analytics_google_id: z.string().trim().max(50).optional().nullable().or(z.literal('')),
});

export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;
