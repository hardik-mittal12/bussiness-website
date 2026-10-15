'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/lib/types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const displayImages = images && images.length > 0 ? images : [
    {
      id: 'placeholder',
      product_id: '',
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      alt_text: productName,
      display_order: 0,
      is_primary: true,
      created_at: new Date().toISOString(),
    },
  ];

  const currentImage = displayImages[selectedIdx] || displayImages[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-4/3 sm:aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
        <Image
          src={currentImage.image_url}
          alt={currentImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                selectedIdx === idx
                  ? 'border-blue-900 shadow-xs'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
