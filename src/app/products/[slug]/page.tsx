import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  Share2, 
  MessageCircle, 
  ChevronRight, 
  Home, 
  Layers, 
  Info 
} from 'lucide-react';
import { getProductBySlug, getBusinessSettings } from '@/lib/data-service';
import ProductGallery from '@/components/ProductGallery';
import ContactForm from '@/components/ContactForm';
import { generateProductWhatsAppUrl } from '@/lib/whatsapp';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, false);
  const settings = await getBusinessSettings();

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const title = product.seo_title || `${product.name} | Wholesale Footwear`;
  const description = product.seo_description || product.short_description || 
    `Wholesale carton lot for ${product.name}. Available for B2B footwear retailers across India.`;
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return {
    title: `${title} | ${settings.business_name}`,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      images: primaryImage ? [{ url: primaryImage.image_url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, false);
  const settings = await getBusinessSettings();

  if (!product) {
    notFound();
  }

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wholesale-footwear.example.com';
  const fullProductUrl = `${siteUrl}/products/${product.slug}`;

  // Structured Data (Product Schema)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img) => img.image_url) || [],
    description: product.description || product.short_description,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price_visibility === 'public' && product.wholesale_price ? product.wholesale_price : undefined,
      availability: product.availability_status === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: settings.business_name,
      },
    },
  };

  // WhatsApp click-to-chat URL with the exact required prefilled text
  const waUrl = generateProductWhatsAppUrl({
    phoneNumber: settings.whatsapp_number,
    productName: product.name,
    sku: product.sku,
    productUrl: fullProductUrl,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-950 flex items-center">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/products" className="hover:text-blue-950">
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-950">
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
        <div className="lg:col-span-6">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Product Details Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Identifiers */}
          <div className="border-b border-slate-200 pb-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="bg-blue-50 text-blue-900 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {product.category.name}
                </span>
              )}
              {product.brand && (
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md">
                  Brand: {product.brand.name}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  Article Code: {product.sku}
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

          {/* Wholesale Pricing & MOQ Box */}
          <div className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Wholesale Rate
                </span>
                {product.price_visibility === 'public' && product.wholesale_price ? (
                  <div className="text-2xl font-black text-slate-900">
                    ₹{product.wholesale_price}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ pair (Ex-whs)</span>
                  </div>
                ) : (
                  <div className="text-base font-bold text-blue-950 mt-0.5">
                    Contact for Wholesale Dealership Pricing
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Minimum Order (MOQ)
                </span>
                <span className="inline-flex items-center text-sm font-bold text-slate-800 bg-white px-3 py-1 rounded border border-slate-200 mt-1">
                  <Package className="w-4 h-4 mr-1 text-amber-500" />
                  {product.moq} Pairs (1 Master Carton)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200/70 pt-3">
              Sold strictly in complete carton assortments. GST and road transport freight applicable extra on lorry receipt (bilty).
            </p>
          </div>

          {/* Available Sizes Curve */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Carton Size Breakdown:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.available_sizes.map((size) => (
                  <div
                    key={size}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border border-slate-200 bg-white font-mono text-sm font-semibold text-slate-800 shadow-2xs"
                  >
                    <span>{size}</span>
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 block">
                Standard Indian footwear sizing scale (UK / India).
              </span>
            </div>
          )}

          {/* Specifications Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100/70 px-4 py-2 font-semibold text-slate-700 uppercase tracking-wider">
              Product Specifications
            </div>
            <dl className="divide-y divide-slate-100 bg-white">
              {product.material && (
                <div className="px-4 py-2.5 grid grid-cols-3">
                  <dt className="font-medium text-slate-500">Upper & Sole Material</dt>
                  <dd className="col-span-2 text-slate-800 font-medium">{product.material}</dd>
                </div>
              )}
              {product.color && (
                <div className="px-4 py-2.5 grid grid-cols-3">
                  <dt className="font-medium text-slate-500">Standard Colors</dt>
                  <dd className="col-span-2 text-slate-800 font-medium">{product.color}</dd>
                </div>
              )}
              <div className="px-4 py-2.5 grid grid-cols-3">
                <dt className="font-medium text-slate-500">Availability Status</dt>
                <dd className="col-span-2 text-emerald-700 font-semibold capitalize">
                  {product.availability_status.replace('_', ' ')}
                </dd>
              </div>
              <div className="px-4 py-2.5 grid grid-cols-3">
                <dt className="font-medium text-slate-500">Packaging Type</dt>
                <dd className="col-span-2 text-slate-800 font-medium">Individual branded shoe boxes inside master carton</dd>
              </div>
            </dl>
          </div>

          {/* WhatsApp Primary Call To Action */}
          <div className="space-y-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-6 py-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
            >
              <MessageCircle className="w-5 h-5 mr-2.5 fill-current" />
              <span>Enquire on WhatsApp for Carton Rates</span>
            </a>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center">
                <Truck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Dispatch via Approved Transport
              </span>
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Verified B2B Supply
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description & Ordering Details */}
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

      {/* Embedded Wholesale Enquiry Form for this specific product */}
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
              Fill in your shop details below to receive a formal wholesale proforma quote and bilty freight estimate.
            </p>
          </div>

          <ContactForm
            defaultEnquiryType="product"
            productId={product.id}
            productName={product.name}
            sku={product.sku}
          />
        </div>
      </div>
    </div>
  );
}
