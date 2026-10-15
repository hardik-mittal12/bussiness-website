import { describe, it, expect } from 'vitest';
import { 
  cleanPhoneNumber, 
  generateProductWhatsAppUrl, 
  generateGeneralWhatsAppUrl, 
  generateCatalogueWhatsAppUrl 
} from '../lib/whatsapp';

describe('WhatsApp Integration Utilities', () => {
  it('cleans phone number by stripping spaces, pluses, and hyphens', () => {
    expect(cleanPhoneNumber('+91 98765-43210')).toBe('919876543210');
    expect(cleanPhoneNumber('+91 (98765) 43210')).toBe('919876543210');
    expect(cleanPhoneNumber('919876543210')).toBe('919876543210');
  });

  it('generates a prefilled product enquiry message with SKU and URL', () => {
    const url = generateProductWhatsAppUrl({
      phoneNumber: '+91 98765 43210',
      productName: 'AeroRunner Mesh Trainer Pro',
      sku: 'SP-RUN-01',
      productUrl: 'https://apexfootwear.example.com/products/aerorunner',
    });

    expect(url).toContain('https://wa.me/919876543210?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('AeroRunner Mesh Trainer Pro');
    expect(decoded).toContain('SP-RUN-01');
    expect(decoded).toContain('wholesale price, available sizes, minimum order quantity');
    expect(decoded).toContain('https://apexfootwear.example.com/products/aerorunner');
  });

  it('handles product enquiry without SKU or URL gracefully', () => {
    const url = generateProductWhatsAppUrl({
      phoneNumber: '919876543210',
      productName: 'Classic Oxford Derby',
    });

    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Classic Oxford Derby');
    expect(decoded).not.toContain('Product code');
    expect(decoded).toContain('https://wa.me/919876543210');
  });

  it('returns # when phone number is null or empty', () => {
    expect(generateGeneralWhatsAppUrl(null)).toBe('#');
    expect(generateProductWhatsAppUrl({ productName: 'Test' })).toBe('#');
  });

  it('generates general wholesale enquiry message', () => {
    const url = generateGeneralWhatsAppUrl('919876543210');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('wholesale footwear catalogue');
  });

  it('generates category-specific catalogue enquiry message', () => {
    const url = generateCatalogueWhatsAppUrl('919876543210', "Men's Formal");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Men's Formal");
    expect(decoded).toContain('wholesale price list');
  });
});
