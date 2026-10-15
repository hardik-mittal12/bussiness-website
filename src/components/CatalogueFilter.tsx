'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Category, Brand } from '@/lib/types';

interface CatalogueFilterProps {
  categories: Category[];
  brands: Brand[];
  currentCategory?: string;
  currentBrand?: string;
  currentSearch?: string;
  currentSort?: string;
}

export default function CatalogueFilter({
  categories,
  brands,
  currentCategory = '',
  currentBrand = '',
  currentSearch = '',
  currentSort = 'newest',
}: CatalogueFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', search.trim());
  };

  const clearAllFilters = () => {
    setSearch('');
    startTransition(() => {
      router.push('/products');
    });
  };

  const hasActiveFilters = Boolean(currentCategory || currentBrand || currentSearch || (currentSort && currentSort !== 'newest'));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search footwear by model name, SKU (e.g. SP-RUN), or material..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-900 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                updateParam('q', '');
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Sort Selector */}
        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900"
            aria-label="Sort products"
          >
            <option value="newest">Recently Added</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
            <option value="moq_asc">Lowest MOQ First</option>
          </select>
        </div>
      </div>

      {/* Middle Row: Category Filter Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Categories
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-rose-600 hover:text-rose-700"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => updateParam('category', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !currentCategory
                ? 'bg-blue-950 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam('category', isSelected ? '' : cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-950 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filters (if brands exist) */}
      {brands.length > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Brands:</span>
          <button
            type="button"
            onClick={() => updateParam('brand', '')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !currentBrand
                ? 'bg-slate-800 text-white font-medium'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => {
            const isSelected = currentBrand === b.slug;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => updateParam('brand', isSelected ? '' : b.slug)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      )}

      {isPending && (
        <div className="text-xs text-blue-800 animate-pulse font-medium">
          Updating catalogue...
        </div>
      )}
    </div>
  );
}
