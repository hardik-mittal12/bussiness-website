import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { getProductById, getBusinessSettings } from '@/lib/data-service';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPreviewPage({ params }: ProductPreviewPageProps) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const product = await getProductById(id);
  const settings = await getBusinessSettings();

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ProductDetailClient
        product={product}
        settings={settings}
        isPreview={true}
      />
    </div>
  );
}
