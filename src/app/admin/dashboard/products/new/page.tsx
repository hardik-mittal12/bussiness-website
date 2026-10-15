import React from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { getCategories, getBrands } from '@/lib/data-service';

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    getCategories(true),
    getBrands(),
  ]);

  return <ProductForm categories={categories} brands={brands} />;
}
