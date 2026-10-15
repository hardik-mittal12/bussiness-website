'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Star, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon 
} from 'lucide-react';
import { Product, Category, Brand, ProductImage } from '@/lib/types';
import { productSchema } from '@/lib/validation';

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: Category[];
  brands: Brand[];
}

export default function ProductForm({
  initialProduct,
  categories,
  brands,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    slug: initialProduct?.slug || '',
    sku: initialProduct?.sku || '',
    category_id: initialProduct?.category_id || '',
    brand_id: initialProduct?.brand_id || '',
    short_description: initialProduct?.short_description || '',
    description: initialProduct?.description || '',
    material: initialProduct?.material || '',
    available_sizes: initialProduct?.available_sizes?.join(', ') || '6, 7, 8, 9, 10',
    color: initialProduct?.color || '',
    wholesale_price: initialProduct?.wholesale_price ? String(initialProduct.wholesale_price) : '',
    price_visibility: initialProduct?.price_visibility || 'contact',
    moq: initialProduct?.moq ? String(initialProduct.moq) : '12',
    availability_status: initialProduct?.availability_status || 'in_stock',
    is_featured: initialProduct?.is_featured || false,
    status: initialProduct?.status || 'draft',
    seo_title: initialProduct?.seo_title || '',
    seo_description: initialProduct?.seo_description || '',
  });

  const [images, setImages] = useState<Partial<ProductImage>[]>(
    initialProduct?.images || [
      {
        id: 'img-new-1',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        alt_text: '',
        display_order: 0,
        is_primary: true,
      },
    ]
  );

  const [newImageUrl, setNewImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-slug from name if adding new product and slug hasn't been manually detached
  const handleNameChange = (val: string) => {
    setIsDirty(true);
    setFormData((prev) => {
      const updates: typeof prev = { ...prev, name: val };
      if (!isEdit && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        updates.slug = generateSlug(val);
      }
      return updates;
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setIsDirty(true);
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        image_url: newImageUrl.trim(),
        alt_text: formData.name,
        display_order: prev.length,
        is_primary: prev.length === 0,
      },
    ]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setIsDirty(true);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  const setPrimaryImage = (index: number) => {
    setIsDirty(true);
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };

  const handleSave = async (targetStatus?: 'draft' | 'published') => {
    setErrors({});
    setServerError(null);
    setSuccessMsg(null);

    const sizesArray = formData.available_sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      sku: formData.sku.trim() || null,
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      short_description: formData.short_description.trim() || null,
      description: formData.description.trim() || null,
      material: formData.material.trim() || null,
      available_sizes: sizesArray,
      color: formData.color.trim() || null,
      wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
      price_visibility: formData.price_visibility as 'contact' | 'public' | 'hidden',
      moq: parseInt(formData.moq, 10) || 12,
      availability_status: formData.availability_status as 'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock',
      is_featured: formData.is_featured,
      status: targetStatus || formData.status,
      seo_title: formData.seo_title.trim() || null,
      seo_description: formData.seo_description.trim() || null,
      images: images.filter((img) => img.image_url),
    };

    // Validate with Zod
    const validation = productSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setServerError('Please fix the validation errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/products/${initialProduct?.id}`
        : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setIsDirty(false);
      setSuccessMsg(`Product saved successfully as ${payload.status}`);

      if (!isEdit && data.product?.id) {
        setTimeout(() => {
          router.push('/admin/dashboard/products');
        }, 1200);
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            title="Back to products list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? `Edit Article: ${initialProduct?.name}` : 'Add New Footwear Article'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit ? 'Update product details, sizes, carton pricing, and images.' : 'Create a new product listing in your wholesale catalogue.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Publish to Catalogue</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {serverError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (Main Details) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Basic Info Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Primary Article Information
            </h2>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. AeroRunner Mesh Trainer Pro"
                className={`w-full px-3.5 py-2.5 text-xs rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                  errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-950'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slug" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  placeholder="aerorunner-mesh-trainer-pro"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                    errors.slug ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-950'
                  }`}
                />
                {errors.slug && <p className="text-xs text-rose-600 mt-1">{errors.slug}</p>}
              </div>

              <div>
                <label htmlFor="sku" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  SKU / Article Code
                </label>
                <input
                  type="text"
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, sku: e.target.value });
                  }}
                  placeholder="e.g. SP-RUN-01"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, category_id: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="brand_id" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  id="brand_id"
                  value={formData.brand_id}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, brand_id: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                >
                  <option value="">No Brand (Generic / Direct Wholesale)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="short_description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Short Description (Catalogue summary)
              </label>
              <input
                type="text"
                id="short_description"
                value={formData.short_description}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, short_description: e.target.value });
                }}
                placeholder="Brief 1-line summary for product cards"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Wholesale Description & Specifications
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, description: e.target.value });
                }}
                placeholder="Detailed specifications, sole construction, packaging ratio, transport dispatch guidelines..."
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>
          </div>

          {/* Wholesale Sizing, MOQ & Pricing */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Wholesale Specifications & Packaging
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="available_sizes" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Carton Sizes (Comma separated)
                </label>
                <input
                  type="text"
                  id="available_sizes"
                  value={formData.available_sizes}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, available_sizes: e.target.value });
                  }}
                  placeholder="e.g. 6, 7, 8, 9, 10"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>

              <div>
                <label htmlFor="moq" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Order Quantity (MOQ Pairs)
                </label>
                <input
                  type="number"
                  id="moq"
                  min={1}
                  value={formData.moq}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, moq: e.target.value });
                  }}
                  placeholder="12"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="material" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Material & Sole
                </label>
                <input
                  type="text"
                  id="material"
                  value={formData.material}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, material: e.target.value });
                  }}
                  placeholder="e.g. Synthetic Leatherette & TPR Sole"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Color Options
                </label>
                <input
                  type="text"
                  id="color"
                  value={formData.color}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, color: e.target.value });
                  }}
                  placeholder="e.g. Tan, Jet Black"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="wholesale_price" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Wholesale Price per Pair (₹)
                </label>
                <input
                  type="number"
                  id="wholesale_price"
                  step="0.01"
                  value={formData.wholesale_price}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, wholesale_price: e.target.value });
                  }}
                  placeholder="e.g. 420.00"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                />
              </div>

              <div>
                <label htmlFor="price_visibility" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Public Price Visibility
                </label>
                <select
                  id="price_visibility"
                  value={formData.price_visibility}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, price_visibility: e.target.value as 'contact' | 'public' | 'hidden' });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                >
                  <option value="contact">Contact / Enquiry Only (Recommended for Wholesale)</option>
                  <option value="public">Show Publicly (₹ Price / pair)</option>
                  <option value="hidden">Hidden Completely</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Photographs Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Product Photographs</span>
              <span className="text-[11px] font-normal text-slate-500">
                Starred image is primary
              </span>
            </h2>

            {/* Existing images gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`relative rounded-lg border-2 overflow-hidden bg-slate-50 aspect-square group ${
                    img.is_primary ? 'border-amber-400' : 'border-slate-200'
                  }`}
                >
                  {img.image_url ? (
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || `Photo ${idx + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(idx)}
                      className={`p-1 rounded-md shadow-xs ${
                        img.is_primary
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-white/80 text-slate-600 hover:bg-white'
                      }`}
                      title={img.is_primary ? 'Primary Image' : 'Set as Primary'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded-md bg-white/80 text-rose-600 hover:bg-white shadow-xs"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Image URL input */}
            <div className="pt-2 flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL (HTTPS / Supabase Storage)..."
                className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Image
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Status, Availability, SEO) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing & Availability Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Publication Status
            </h2>

            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-600 mb-1">
                Catalogue Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' });
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              >
                <option value="draft">Draft (Private, not visible on website)</option>
                <option value="published">Published (Live in public catalogue)</option>
                <option value="archived">Archived (Delisted)</option>
              </select>
            </div>

            <div>
              <label htmlFor="availability_status" className="block text-xs font-semibold text-slate-600 mb-1">
                Stock Availability Status
              </label>
              <select
                id="availability_status"
                value={formData.availability_status}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, availability_status: e.target.value as 'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock' });
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              >
                <option value="in_stock">In Stock (Ready for Dispatch)</option>
                <option value="made_to_order">Made to Order / Production Run</option>
                <option value="low_stock">Low Stock (Limited Cartons)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, is_featured: e.target.checked });
                  }}
                  className="rounded border-slate-300 text-blue-950 focus:ring-blue-950 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Feature on Homepage
                </span>
              </label>
            </div>
          </div>

          {/* Search Engine Optimization (SEO) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              SEO & Social Metadata
            </h2>

            <div>
              <label htmlFor="seo_title" className="block text-xs font-semibold text-slate-600 mb-1">
                SEO Title Override
              </label>
              <input
                type="text"
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, seo_title: e.target.value });
                }}
                placeholder="Product Name | Wholesale"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label htmlFor="seo_description" className="block text-xs font-semibold text-slate-600 mb-1">
                SEO Meta Description
              </label>
              <textarea
                id="seo_description"
                rows={3}
                value={formData.seo_description}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, seo_description: e.target.value });
                }}
                placeholder="Short meta description for search engine result snippets"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
