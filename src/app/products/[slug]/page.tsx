import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug, getBusinessSettings } from '@/lib/data-service';
import ProductDetailClient from '@/components/ProductDetailClient';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ProductDetailClient
        product={product}
        settings={settings}
      />
    </div>
  );
}
