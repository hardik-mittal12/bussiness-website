/**
 * Utilities for WhatsApp Click-to-Chat integration
 */

export function cleanPhoneNumber(phone: string): string {
  // Strip non-digit characters (+, spaces, dashes, parentheses)
  return phone.replace(/\D/g, '');
}

export interface ProductWhatsAppParams {
  phoneNumber?: string | null;
  productName: string;
  sku?: string | null;
  productUrl?: string;
  colourName?: string | null;
  variantSku?: string | null;
  cartonQuantity?: number | null;
  packagingTypeName?: string | null;
}

export function generateProductWhatsAppUrl({
  phoneNumber,
  productName,
  sku,
  productUrl,
  colourName,
  variantSku,
  cartonQuantity,
  packagingTypeName,
}: ProductWhatsAppParams): string {
  if (!phoneNumber) return '#';
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  
  const skuText = sku ? ` (Product code: ${sku})` : '';
  const colourText = colourName
    ? ` in ${colourName}${variantSku ? ` [SKU: ${variantSku}]` : ''}`
    : '';
  const pkgDetails = [];
  if (packagingTypeName) pkgDetails.push(packagingTypeName);
  if (cartonQuantity) pkgDetails.push(`${cartonQuantity} pairs/carton`);
  const packagingText = pkgDetails.length > 0 ? ` (${pkgDetails.join(', ')})` : '';
  const urlText = productUrl ? ` Product link: ${productUrl}` : '';
  
  const message = `Hello, I am interested in ${productName}${skuText}${colourText}${packagingText}. Please share the wholesale price, available sizes, minimum order quantity, and current availability.${urlText}`;
  
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function generateGeneralWhatsAppUrl(phoneNumber?: string | null, customMessage?: string): string {
  if (!phoneNumber) return '#';
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const defaultMessage = customMessage || "Hello, I am a footwear retailer/buyer and would like to enquire about wholesale footwear catalogue, bulk availability, and terms.";
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;
}

export function generateCatalogueWhatsAppUrl(phoneNumber?: string | null, categoryName?: string): string {
  if (!phoneNumber) return '#';
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const msg = categoryName 
    ? `Hello, I am interested in your wholesale ${categoryName} footwear collection. Please share the latest catalogue, minimum order quantities, and wholesale price list.`
    : "Hello, I am interested in exploring your wholesale footwear catalogue. Please share the complete product list, bulk order pricing, and dispatch details.";
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
}
