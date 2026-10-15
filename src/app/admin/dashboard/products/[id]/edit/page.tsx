import React from 'react';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { getProductById, getCategories, getBrands, getPackagingTypes } from '@/lib/data-service';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, brands, packagingTypes] = await Promise.all([
    getProductById(id),
    getCategories(true),
    getBrands(true),
    getPackagingTypes(true),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialProduct={product}
      categories={categories}
      brands={brands}
      packagingTypes={packagingTypes}
    />
  );
}
