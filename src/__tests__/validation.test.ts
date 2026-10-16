import { describe, it, expect } from 'vitest';
import { 
  enquirySchema, 
  productSchema, 
  categorySchema, 
  businessSettingsSchema 
} from '../lib/validation';

describe('Validation Schemas', () => {
  describe('Enquiry Schema', () => {
    it('accepts valid wholesale enquiry data', () => {
      const valid = {
        name: 'Ramesh Patel',
        shop_name: 'Patel Footwear Stores',
        phone: '+91 98765 43210',
        email: 'ramesh@example.com',
        city: 'Ahmedabad',
        enquiry_type: 'bulk_pricing',
        message: 'Interested in purchasing 10 cartons of sports shoes for Diwali season.',
        website_hp: '',
      };

      const result = enquirySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects submissions with missing required fields (name, phone, city, message)', () => {
      const invalid = {
        name: '',
        phone: '',
        city: '',
        message: '',
      };

      const result = enquirySchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain('name');
        expect(issues).toContain('phone');
        expect(issues).toContain('city');
        expect(issues).toContain('message');
      }
    });

    it('detects honeypot spam bot traps when website_hp is populated', () => {
      const spam = {
        name: 'Bot Spammer',
        phone: '1234567890',
        city: 'Spam City',
        message: 'Spam promotional offer',
        website_hp: 'http://spam-link.ru',
      };

      const result = enquirySchema.safeParse(spam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Spam detected');
      }
    });
  });

  describe('Product Schema', () => {
    it('accepts valid product with all wholesale parameters', () => {
      const valid = {
        name: 'AeroMax Trainer v2',
        slug: 'aeromax-trainer-v2',
        sku: 'AM-TRN-02',
        wholesale_price: 450,
        price_visibility: 'contact',
        moq: 12,
        available_sizes: ['6', '7', '8', '9', '10'],
        availability_status: 'in_stock',
        status: 'published',
      };

      const result = productSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid product slug formats', () => {
      const invalid = {
        name: 'Product Name',
        slug: 'Invalid Slug With Capitals & Spaces',
        moq: 12,
      };

      const result = productSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects non-positive MOQ', () => {
      const invalid = {
        name: 'Product Name',
        slug: 'product-name',
        moq: 0,
      };

      const result = productSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Category Schema', () => {
    it('validates correct category data', () => {
      const valid = {
        name: "Kids' School Footwear",
        slug: 'kids-school-footwear',
        description: 'Durable school shoe cartons',
        display_order: 1,
        is_active: true,
      };

      const result = categorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('Business Settings Schema', () => {
    it('validates business settings and preserves hero_image_url and location fields', () => {
      const valid = {
        business_name: 'Shiv Ganga Traders',
        city: 'Chandigarh',
        state: 'Chandigarh',
        pincode: '160047',
        hero_headline: 'Direct Wholesale Footwear Supply',
        hero_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      };

      const result = businessSettingsSchema.partial().safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hero_image_url).toBe('https://images.unsplash.com/photo-1542291026-7eec264c27ff');
        expect(result.data.state).toBe('Chandigarh');
        expect(result.data.pincode).toBe('160047');
      }
    });
  });
});
