'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Download,
  Upload,
  Boxes,
  Tag,
  Check,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { Product, Category, Brand } from '@/lib/types';
import { computeProductCompleteness } from '@/lib/completeness';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete Confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    samplePreview: unknown[];
    errors: { row: number; errors: string[] }[];
  } | null>(null);

  const fetchLookups = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/brands'),
      ]);
      const cats = await catRes.json();
      const brs = await brandRes.json();
      setCategories(cats || []);
      setBrands(brs || []);
    } catch (err) {
      console.error('Error fetching lookups:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      let list: Product[] = data.products || [];

      if (categoryFilter !== 'all') {
        list = list.filter((p) => p.category_id === categoryFilter);
      }
      if (brandFilter !== 'all') {
        list = list.filter((p) => p.brand_id === brandFilter);
      }

      setProducts(list);
      // Clean up selection if products were filtered out
      setSelectedIds((prev) => prev.filter((id) => list.some((p) => p.id === id)));
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, categoryFilter, brandFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Operations
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete' | 'assign_category') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} selected product(s)?`)) {
      return;
    }

    setIsBulkExecuting(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          category_id: action === 'assign_category' ? bulkCategoryTarget || null : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk operation failed');

      setNotification({
        type: 'success',
        message: `Bulk action (${action}) completed successfully on ${data.count ?? selectedIds.length} item(s)`,
      });
      setSelectedIds([]);
      fetchProducts();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Bulk operation failed',
      });
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({
        type: 'success',
        message: `Product ${newStatus === 'published' ? 'published' : 'moved to draft'} successfully`,
      });
      fetchProducts();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Status update failed',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplication failed');

      setNotification({ type: 'success', message: 'Product duplicated with colourways as draft' });
      fetchProducts();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Duplication failed',
      });
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: 'success', message: 'Product deleted from inventory' });
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Dry Run Preview
  const handleDryRunPreview = async () => {
    if (!csvInput.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvInput, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dry run failed');
      setImportPreview(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'CSV validation failed');
    } finally {
      setIsImporting(false);
    }
  };

  // CSV Execute Import
  const handleExecuteImport = async () => {
    if (!csvInput.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvInput, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setNotification({
        type: 'success',
        message: `CSV Import complete: ${data.importedCount} products created/updated.`,
      });
      setIsImportModalOpen(false);
      setCsvInput('');
      setImportPreview(null);
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'CSV import execution failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvInput(event.target?.result as string || '');
      setImportPreview(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            Wholesale Footwear Catalogue & Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage footwear articles, colourways, packaging cartons, completeness, and bulk status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/admin/products/export"
            download
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </a>

          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setImportPreview(null);
            }}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import CSV
          </button>

          <Link
            href="/admin/dashboard/products/new"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, material..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 outline-none"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">Products Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkAction('publish')}
              disabled={isBulkExecuting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Publish Selected
            </button>

            <button
              onClick={() => handleBulkAction('unpublish')}
              disabled={isBulkExecuting}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Draft Selected
            </button>

            <button
              onClick={() => handleBulkAction('archive')}
              disabled={isBulkExecuting}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Archive Selected
            </button>

            {/* Bulk Category Assign */}
            <div className="flex items-center space-x-1">
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-white border border-slate-700 outline-none"
              >
                <option value="">Choose Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleBulkAction('assign_category')}
                disabled={isBulkExecuting || !bulkCategoryTarget}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                Assign
              </button>
            </div>

            <button
              onClick={() => handleBulkAction('delete')}
              disabled={isBulkExecuting}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Delete Selected
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="font-semibold text-slate-700 text-sm">Loading inventory catalogue...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {selectedIds.length === products.length && products.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Article / Footwear</th>
                  <th className="px-5 py-3.5">Brand & Category</th>
                  <th className="px-5 py-3.5">Colourways</th>
                  <th className="px-5 py-3.5">Packaging Specification</th>
                  <th className="px-5 py-3.5">Completeness</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0];
                  const completeness = computeProductCompleteness(p);
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(p.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                            {primaryImg ? (
                              <Image
                                src={primaryImg.image_url}
                                alt={p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{p.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.sku && (
                                <span className="font-mono text-[10px] text-slate-500 uppercase font-semibold">
                                  {p.sku}
                                </span>
                              )}
                              {p.is_featured && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                              {p.wholesale_price && (
                                <span className="text-[11px] font-bold text-slate-800">
                                  ₹{p.wholesale_price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {p.brand ? (
                            <div className="font-semibold text-slate-800 flex items-center">
                              <Tag className="w-3 h-3 mr-1 text-blue-600" />
                              {p.brand.name}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No brand</span>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {p.category?.name || 'Unassigned category'}
                          </div>
                        </div>
                      </td>

                      {/* Colour Variants Swatches */}
                      <td className="px-5 py-3.5">
                        {p.variants && p.variants.length > 0 ? (
                          <div className="flex items-center space-x-1.5">
                            {p.variants.slice(0, 4).map((v, vIdx) => (
                              <div
                                key={v.id || vIdx}
                                className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs relative group shrink-0 cursor-pointer"
                                style={{ backgroundColor: v.hex_code || '#64748B' }}
                                title={`${v.colour_name}${v.pattern ? ` (${v.pattern})` : ''}`}
                              />
                            ))}
                            {p.variants.length > 4 && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                                +{p.variants.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No colourways</span>
                        )}
                      </td>

                      {/* Packaging Specification */}
                      <td className="px-5 py-3.5">
                        {p.packaging_type ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <Boxes className="w-3 h-3 mr-1 text-slate-600" />
                              {p.packaging_type.name}
                            </span>
                            {p.packaging_pairs_per_carton && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                {p.packaging_pairs_per_carton} pairs / carton
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unspecified</span>
                        )}
                      </td>

                      {/* Completeness Badge */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                completeness.isComplete
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : completeness.score >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {completeness.score}% Complete
                            </span>
                          </div>
                          {!completeness.isComplete && completeness.missingFields.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs" title={`Missing: ${completeness.missingFields.join(', ')}`}>
                              Missing: {completeness.missingFields.slice(0, 2).join(', ')}
                              {completeness.missingFields.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Publication Status */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(p)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 ${
                            p.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : p.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {p.status === 'published' ? (
                            <Eye className="w-3 h-3 mr-1 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-3 h-3 mr-1 text-amber-600" />
                          )}
                          <span>{p.status}</span>
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Admin Draft Preview */}
                          <Link
                            href={`/admin/dashboard/products/${p.id}/preview`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Admin Preview Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Make a Copy (Duplicate as Draft)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <Link
                            href={`/admin/dashboard/products/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No products match your filters</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting search or status filters.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Confirm Product Deletion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this footwear article? This permanently removes the product, its colourway configurations, and attached photographs.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal with Dry-Run Preview */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-600" />
                  Import Products from CSV
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulk upload footwear articles with colourways and packaging specs. Supports dry-run validation.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* File Uploader */}
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Choose CSV File
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Accepted columns: Name, Slug, SKU, Category, Brand, Packaging Type, MOQ, Price, Variants, Image URL
                </p>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Or Paste CSV Data Directly
                </label>
                <textarea
                  rows={6}
                  value={csvInput}
                  onChange={(e) => {
                    setCsvInput(e.target.value);
                    setImportPreview(null);
                  }}
                  placeholder="Name,Slug,SKU,Category,Brand,MOQ,Price,Variants&#10;Apex Derby,apex-derby,APX-01,Formal,Apex Walk,12,850,&quot;Black (#000000), Tan (#D2B48C)&quot;"
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Dry Run Preview Summary */}
              {importPreview && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Validation Dry-Run Results
                    </span>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {importPreview.validCount} Valid Rows
                      </span>
                      {importPreview.invalidCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                          {importPreview.invalidCount} Errors
                        </span>
                      )}
                    </div>
                  </div>

                  {importPreview.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
                      <p className="font-semibold">Issues Detected:</p>
                      {importPreview.errors.map((err, idx) => (
                        <div key={idx}>
                          Row {err.row}: {err.errors.join('; ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDryRunPreview}
                disabled={!csvInput.trim() || isImporting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Validating...' : 'Validate & Dry Run'}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={!csvInput.trim() || isImporting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Confirm & Import Products'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
