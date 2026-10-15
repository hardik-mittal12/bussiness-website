import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, MessageCircle, ArrowRight, Boxes } from 'lucide-react';
import { Product } from '@/lib/types';
import { generateProductWhatsAppUrl } from '@/lib/whatsapp';

interface ProductCardProps {
  product: Product;
  whatsappNumber?: string | null;
}

export default function ProductCard({ product, whatsappNumber }: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
  const altText = primaryImage?.alt_text || product.name;

  const firstVariant = product.variants?.[0];

  const waUrl = generateProductWhatsAppUrl({
    phoneNumber: whatsappNumber,
    productName: product.name,
    sku: product.sku,
    colourName: firstVariant?.colour_name || null,
    variantSku: firstVariant?.variant_sku || null,
    cartonQuantity: product.packaging_pairs_per_carton || product.moq || null,
    packagingTypeName: product.packaging_type?.name || null,
  });

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category or Brand Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.brand && (
            <span className="bg-blue-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {product.brand.name}
            </span>
          )}
          {product.category && (
            <span className="bg-white/90 backdrop-blur-xs text-slate-900 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Packaging / MOQ Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {product.packaging_type && (
            <span className="inline-flex items-center bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              <Boxes className="w-3 h-3 mr-1 text-blue-600" />
              {product.packaging_pairs_per_carton ? `${product.packaging_pairs_per_carton} prs/ctn` : product.packaging_type.name}
            </span>
          )}
          <span className="inline-flex items-center bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-xs">
            <Package className="w-3 h-3 mr-1 text-amber-400" />
            MOQ: {product.moq}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex-1">
          {product.sku && (
            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wide block mb-1">
              Code: {product.sku}
            </span>
          )}

          <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-900 transition-colors line-clamp-2">
            <Link href={`/products/${product.slug}`} className="focus:outline-hidden">
              {product.name}
            </Link>
          </h3>

          {product.short_description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Colour Swatches Preview */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Colours:</span>
              <div className="flex items-center space-x-1">
                {product.variants.slice(0, 4).map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: v.hex_code || '#64748B' }}
                    title={v.colour_name}
                  />
                ))}
                {product.variants.length > 4 && (
                  <span className="text-[9px] font-bold text-slate-400">
                    +{product.variants.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sizes preview */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium">Sizes:</span>
              <div className="flex flex-wrap gap-1">
                {product.available_sizes.slice(0, 5).map((size) => (
                  <span
                    key={size}
                    className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono"
                  >
                    {size}
                  </span>
                ))}
                {product.available_sizes.length > 5 && (
                  <span className="text-[10px] text-slate-400">...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div>
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Wholesale</span>
            {product.price_visibility === 'public' && product.wholesale_price ? (
              <span className="text-base font-bold text-slate-900">
                ₹{product.wholesale_price}
                <span className="text-xs font-normal text-slate-500"> /pair</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Contact for Price
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="View Specifications"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-[#25D366] hover:bg-[#20ba59] rounded-lg shadow-xs transition-colors"
              title="Enquire on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1 fill-current" />
              <span>Enquire</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
