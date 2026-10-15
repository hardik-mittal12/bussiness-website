import React from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { getCategories, getBrands, getPackagingTypes } from '@/lib/data-service';

export default async function NewProductPage() {
  const [categories, brands, packagingTypes] = await Promise.all([
    getCategories(true),
    getBrands(true),
    getPackagingTypes(true),
  ]);

  return (
    <ProductForm
      categories={categories}
      brands={brands}
      packagingTypes={packagingTypes}
    />
  );
}
