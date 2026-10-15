'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  MessageCircle, 
  ChevronRight, 
  Home, 
  Boxes,
  Palette,
  Check,
  Info,
  Scale,
  Maximize2
} from 'lucide-react';
import { Product, ProductVariant, BusinessSettings, ProductImage } from '@/lib/types';
import ContactForm from '@/components/ContactForm';
import { generateProductWhatsAppUrl } from '@/lib/whatsapp';

interface ProductDetailClientProps {
  product: Product;
  settings: BusinessSettings;
  isPreview?: boolean;
}

export default function ProductDetailClient({
  product,
  settings,
  isPreview = false,
}: ProductDetailClientProps) {
  const variants = (product.variants || []).filter((v) => v.is_active);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id || null
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0] || null;

  // Filter gallery images based on selected variant
  const allImages = product.images && product.images.length > 0 ? product.images : [
    {
      id: 'placeholder',
      product_id: product.id,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      alt_text: product.name,
      display_order: 0,
      is_primary: true,
      created_at: new Date().toISOString(),
    },
  ];

  const variantSpecificImages = selectedVariantId
    ? allImages.filter((img) => img.variant_id === selectedVariantId)
    : [];

  const displayImages = variantSpecificImages.length > 0
    ? variantSpecificImages
    : allImages;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const safePhotoIdx = activePhotoIdx < displayImages.length ? activePhotoIdx : 0;
  const currentPhoto = displayImages[safePhotoIdx] || allImages[0];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wholesale-footwear.example.com';
  const fullProductUrl = `${siteUrl}/products/${product.slug}`;

  // WhatsApp click-to-chat URL with selected colourway and packaging
  const waUrl = generateProductWhatsAppUrl({
    phoneNumber: settings.whatsapp_number,
    productName: product.name,
    sku: product.sku,
    productUrl: fullProductUrl,
    colourName: selectedVariant?.colour_name || null,
    variantSku: selectedVariant?.variant_sku || null,
    cartonQuantity: product.packaging_pairs_per_carton || product.moq || null,
    packagingTypeName: product.packaging_type?.name || null,
  });

  return (
    <div className="space-y-10">
      {/* Admin Draft / Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-sm font-semibold text-xs gap-2">
          <div className="flex items-center">
            <Info className="w-4 h-4 mr-2 text-slate-950" />
            <span>
              <strong>ADMIN PREVIEW MODE</strong> — You are viewing article &ldquo;{product.name}&rdquo; ({product.status.toUpperCase()}). This page is not public.
            </span>
          </div>
          <Link
            href={`/admin/dashboard/products/${product.id}/edit`}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Edit Product
          </Link>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-900 flex items-center">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/products" className="hover:text-blue-900">
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-900">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Photo */}
          <div className="relative aspect-square sm:aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
            <Image
              src={currentPhoto.image_url}
              alt={currentPhoto.alt_text || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            {selectedVariant && (
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/50"
                  style={{ backgroundColor: selectedVariant.hex_code || '#64748B' }}
                />
                <span>{selectedVariant.colour_name}</span>
              </div>
            )}
          </div>

          {/* Photo Note if falling back to general gallery */}
          {selectedVariantId && variantSpecificImages.length === 0 && (
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
              Note: General article photographs displayed. Colourway: <strong>{selectedVariant?.colour_name}</strong>.
            </p>
          )}

          {/* Gallery Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    safePhotoIdx === idx
                      ? 'border-blue-900 shadow-sm scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text || `${product.name} photo ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Badges */}
          <div className="border-b border-slate-200 pb-5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="bg-blue-50 text-blue-900 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-200">
                  Brand: {product.brand.name}
                </span>
              )}
              {product.category && (
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md">
                  {product.category.name}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  Article: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Interactive Colourway Swatches Selector */}
          {variants.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                  <Palette className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Select Colourway:
                </span>
                {selectedVariant && (
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedVariant.colour_name}
                    {selectedVariant.pattern ? ` (${selectedVariant.pattern})` : ''}
                    {selectedVariant.variant_sku ? ` · ${selectedVariant.variant_sku}` : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setActivePhotoIdx(0);
                      }}
                      className={`group flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-600/20'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                        style={{ backgroundColor: v.hex_code || '#64748B' }}
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {v.colour_name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wholesale Pricing & MOQ Box */}
          <div className="bg-[#FAF9F6] border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Wholesale Dealership Price
                </span>
                {product.price_visibility === 'public' && product.wholesale_price ? (
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    ₹{product.wholesale_price}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ pair (Ex-factory)</span>
                  </div>
                ) : (
                  <div className="text-base font-bold text-blue-950 mt-1">
                    Contact for Wholesale Dealership Quotation
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Minimum Order (MOQ)
                </span>
                <span className="inline-flex items-center text-sm font-bold text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 mt-1">
                  <Package className="w-4 h-4 mr-1 text-amber-500" />
                  {product.moq} Pairs
                  {product.packaging_pairs_per_carton
                    ? ` (1 Master Carton: ${product.packaging_pairs_per_carton} prs)`
                    : ''}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/70 pt-3">
              Sold strictly in complete carton lots for registered footwear retailers and stockists. GST invoice and transport bilty provided.
            </p>
          </div>

          {/* Packaging & Carton Logistics Section (Only when configured) */}
          {product.packaging_type && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center">
                  <Boxes className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Carton Packaging & Logistics
                  </span>
                </div>
                {product.packaging_included_in_price && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Packaging Included
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Packaging Type</span>
                  <span className="font-semibold text-slate-800">{product.packaging_type.name}</span>
                </div>

                {product.packaging_pairs_per_carton && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Carton Packing</span>
                    <span className="font-semibold text-slate-800">
                      {product.packaging_pairs_per_carton} pairs / carton
                    </span>
                  </div>
                )}

                {product.carton_dimensions && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Carton Size</span>
                    <span className="font-semibold text-slate-800">{product.carton_dimensions}</span>
                  </div>
                )}

                {product.carton_weight && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Gross Weight</span>
                    <span className="font-semibold text-slate-800">{product.carton_weight}</span>
                  </div>
                )}

                {product.packaging_units_per_package && product.packaging_units_per_package > 1 && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Inner Unit Pack</span>
                    <span className="font-semibold text-slate-800">
                      {product.packaging_units_per_package} pairs / pack
                    </span>
                  </div>
                )}
              </div>

              {product.carton_size_assortment && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-0.5">
                    Size Assortment Ratio inside Carton:
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {product.carton_size_assortment}
                  </span>
                </div>
              )}

              {product.packaging_notes && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  {product.packaging_notes}
                </p>
              )}
            </div>
          )}

          {/* Available Sizes Scale */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Available Size Scale (UK / India):
              </span>
              <div className="flex flex-wrap gap-2">
                {product.available_sizes.map((size) => (
                  <div
                    key={size}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-xl border border-slate-200 bg-white font-mono text-sm font-semibold text-slate-800 shadow-2xs"
                  >
                    <span>{size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary WhatsApp Action */}
          <div className="space-y-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
            >
              <MessageCircle className="w-5 h-5 mr-2.5 fill-current" />
              <span>
                Enquire on WhatsApp
                {selectedVariant ? ` (${selectedVariant.colour_name})` : ''}
              </span>
            </a>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center">
                <Truck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Dispatch via Approved Transporters
              </span>
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Direct Wholesale Supply
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Detailed Wholesale Overview
          </h2>
          <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}

      {/* Embedded Wholesale Enquiry Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Formal Quotation Request
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Request Dealership Price for {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Provide your shop and city details to receive a proforma quote and bilty transport estimate.
            </p>
          </div>

          <ContactForm
            defaultEnquiryType="product"
            productId={product.id}
            productName={`${product.name}${selectedVariant ? ` (${selectedVariant.colour_name})` : ''}`}
            sku={selectedVariant?.variant_sku || product.sku}
          />
        </div>
      </div>
    </div>
  );
}
