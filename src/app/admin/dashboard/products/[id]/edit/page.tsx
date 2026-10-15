import React from 'react';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { getProductById, getCategories, getBrands } from '@/lib/data-service';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getProductById(id),
    getCategories(true),
    getBrands(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      initialProduct={product}
      categories={categories}
      brands={brands}
    />
  );
}
