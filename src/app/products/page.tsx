import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PackageX, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { getCategories, getBrands, getProducts, getBusinessSettings } from '@/lib/data-service';
import ProductCard from '@/components/ProductCard';
import CatalogueFilter from '@/components/CatalogueFilter';

interface PageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    q?: string;
    sort?: 'newest' | 'name_asc' | 'name_desc' | 'moq_asc';
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const settings = await getBusinessSettings();
  let title = 'Wholesale Footwear Catalogue';

  if (params.category) {
    const categories = await getCategories(false);
    const cat = categories.find((c) => c.slug === params.category);
    if (cat) {
      title = `${cat.name} Wholesale Footwear`;
    }
  }

  return {
    title: `${title} | ${settings.business_name}`,
    description: `Browse verified wholesale footwear in carton lots. Minimum order quantities, pre-packed sizes, and direct B2B pricing from ${settings.business_name}.`,
    alternates: {
      canonical: '/products',
    },
  };
}

export default async function ProductsCataloguePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10) || 1;
  const currentCategory = params.category || '';
  const currentBrand = params.brand || '';
  const currentSearch = params.q || '';
  const currentSort = params.sort || 'newest';

  const [settings, categories, brands, productsData] = await Promise.all([
    getBusinessSettings(),
    getCategories(false),
    getBrands(),
    getProducts({
      categorySlug: currentCategory || null,
      brandSlug: currentBrand || null,
      searchQuery: currentSearch || null,
      sortBy: currentSort,
      status: 'published', // ONLY published products
      page: currentPage,
      limit: 12,
    }),
  ]);

  const { products, total, totalPages } = productsData;

  const currentCategoryObj = categories.find((c) => c.slug === currentCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-950 flex items-center">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Catalogue</span>
        {currentCategoryObj && (
          <>
            <span>/</span>
            <span className="text-blue-900 font-semibold">{currentCategoryObj.name}</span>
          </>
        )}
      </nav>

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {currentCategoryObj ? currentCategoryObj.name : 'Wholesale Footwear Catalogue'}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          {currentCategoryObj?.description ||
            'Browse our active wholesale footwear inventory ready for carton dispatch. All articles are packaged in standard retail carton ratios with pan-India transport delivery.'}
        </p>
      </div>

      {/* Filter Component */}
      <CatalogueFilter
        categories={categories}
        brands={brands}
        currentCategory={currentCategory}
        currentBrand={currentBrand}
        currentSearch={currentSearch}
        currentSort={currentSort}
      />

      {/* Inventory Count & Notice */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{products.length}</strong> of{' '}
          <strong className="text-slate-800">{total}</strong> published articles
        </span>
        <span className="hidden sm:inline text-slate-400">
          Carton lots only • Ex-warehouse pricing
        </span>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              whatsappNumber={settings.whatsapp_number}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <PackageX className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Matching Articles Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn&apos;t find any published products matching your search criteria. Try modifying your search keywords or resetting category filters.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-950 text-white text-xs font-semibold hover:bg-blue-900 transition-colors"
          >
            Clear All Filters & View Full Inventory
          </Link>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-slate-200 flex items-center justify-center space-x-2">
          {currentPage > 1 ? (
            <Link
              href={`/products?${new URLSearchParams({
                ...(currentCategory && { category: currentCategory }),
                ...(currentBrand && { brand: currentBrand }),
                ...(currentSearch && { q: currentSearch }),
                ...(currentSort && { sort: currentSort }),
                page: String(currentPage - 1),
              }).toString()}`}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </span>
          )}

          <span className="text-xs text-slate-600 px-3 py-2">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={`/products?${new URLSearchParams({
                ...(currentCategory && { category: currentCategory }),
                ...(currentBrand && { brand: currentBrand }),
                ...(currentSearch && { q: currentSearch }),
                ...(currentSort && { sort: currentSort }),
                page: String(currentPage + 1),
              }).toString()}`}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 cursor-not-allowed">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
