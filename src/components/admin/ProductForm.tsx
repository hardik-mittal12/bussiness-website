'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Star, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  Upload,
  Tag,
  Boxes,
  Palette,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
import { Product, Category, Brand, PackagingType, ProductImage, ProductVariant, PriceVisibility, AvailabilityStatus, ProductVariantInput, ProductImageInput } from '@/lib/types';
import { productSchema } from '@/lib/validation';

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: Category[];
  brands: Brand[];
  packagingTypes?: PackagingType[];
}

export default function ProductForm({
  initialProduct,
  categories,
  brands: initialBrands,
  packagingTypes: initialPackagingTypes = [],
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const [brandsList, setBrandsList] = useState<Brand[]>(initialBrands);
  const [packagingList] = useState<PackagingType[]>(initialPackagingTypes);

  // Quick Brand Modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandSlug, setNewBrandSlug] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

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
    // Packaging
    packaging_type_id: initialProduct?.packaging_type_id || '',
    packaging_pairs_per_carton: initialProduct?.packaging_pairs_per_carton ? String(initialProduct.packaging_pairs_per_carton) : '',
    packaging_units_per_package: initialProduct?.packaging_units_per_package ? String(initialProduct.packaging_units_per_package) : '1',
    carton_dimensions: initialProduct?.carton_dimensions || '',
    carton_weight: initialProduct?.carton_weight || '',
    carton_size_assortment: initialProduct?.carton_size_assortment || '',
    packaging_included_in_price: initialProduct?.packaging_included_in_price ?? true,
    packaging_notes: initialProduct?.packaging_notes || '',
  });

  // Colour Variants State
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    initialProduct?.variants && initialProduct.variants.length > 0
      ? initialProduct.variants.map((v) => ({
          id: v.id,
          colour_name: v.colour_name,
          colour_family: v.colour_family || '',
          hex_code: v.hex_code || '',
          pattern: v.pattern || '',
          variant_sku: v.variant_sku || '',
          display_order: v.display_order,
          is_active: v.is_active,
        }))
      : [
          {
            id: crypto.randomUUID(),
            colour_name: 'Classic Black',
            colour_family: 'Black',
            hex_code: '#111827',
            pattern: 'Smooth Matte',
            variant_sku: '',
            display_order: 0,
            is_active: true,
          },
        ]
  );

  // Images State
  const [images, setImages] = useState<ProductImageInput[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img) => ({
          id: img.id,
          variant_id: img.variant_id || null,
          image_url: img.image_url,
          alt_text: img.alt_text || '',
          display_order: img.display_order,
          is_primary: img.is_primary,
        }))
      : [
          {
            id: 'img-new-1',
            variant_id: null,
            image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            alt_text: '',
            display_order: 0,
            is_primary: true,
          },
        ]
  );

  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageVariantTarget, setImageVariantTarget] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setIsDirty(true);
    setFormData((prev) => {
      const updates = { ...prev, name: val };
      if (!isEdit && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        updates.slug = generateSlug(val);
      }
      return updates;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetVariantId?: string | null) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      setServerError('Image file size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setServerError(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      setIsDirty(true);
      const chosenVariantId = targetVariantId !== undefined
        ? targetVariantId
        : (imageVariantTarget === 'all' ? null : imageVariantTarget);

      setImages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          variant_id: chosenVariantId,
          image_url: data.url,
          alt_text: formData.name || 'Product Image',
          display_order: prev.length,
          is_primary: prev.length === 0,
        },
      ]);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const addImageFromUrl = () => {
    if (!newImageUrl.trim()) return;
    setIsDirty(true);
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        variant_id: imageVariantTarget === 'all' ? null : imageVariantTarget,
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

  const updateImageVariant = (imageIndex: number, variantId: string | null) => {
    setIsDirty(true);
    setImages((prev) =>
      prev.map((img, i) => (i === imageIndex ? { ...img, variant_id: variantId } : img))
    );
  };

  // Colour Variant Handlers
  const addVariant = () => {
    setIsDirty(true);
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        colour_name: 'New Colour',
        colour_family: '',
        hex_code: '#4B5563',
        pattern: '',
        variant_sku: '',
        display_order: prev.length,
        is_active: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('Every product must retain at least one colour specification.');
      return;
    }
    setIsDirty(true);
    const targetId = variants[index].id;
    setVariants((prev) => prev.filter((_, i) => i !== index));
    // Clear variant_id on images pointing to deleted variant
    if (targetId) {
      setImages((prev) =>
        prev.map((img) => (img.variant_id === targetId ? { ...img, variant_id: null } : img))
      );
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariantInput, value: unknown) => {
    setIsDirty(true);
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Quick Brand Creation
  const handleQuickBrandCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsCreatingBrand(true);
    try {
      const slug = newBrandSlug.trim() || generateSlug(newBrandName);
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrandName.trim(),
          slug,
          display_order: brandsList.length + 1,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create brand');

      setBrandsList((prev) => [...prev, data.brand]);
      setFormData((prev) => ({ ...prev, brand_id: data.brand.id }));
      setIsBrandModalOpen(false);
      setNewBrandName('');
      setNewBrandSlug('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Brand creation failed');
    } finally {
      setIsCreatingBrand(false);
    }
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
      color: variants.map((v) => v.colour_name).filter(Boolean).join(', ') || null,
      wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
      price_visibility: formData.price_visibility as 'contact' | 'public' | 'hidden',
      moq: parseInt(formData.moq, 10) || 12,
      availability_status: formData.availability_status as 'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock',
      is_featured: formData.is_featured,
      status: targetStatus || formData.status,
      // Packaging
      packaging_type_id: formData.packaging_type_id || null,
      packaging_pairs_per_carton: formData.packaging_pairs_per_carton ? parseInt(formData.packaging_pairs_per_carton, 10) : null,
      packaging_units_per_package: formData.packaging_units_per_package ? parseInt(formData.packaging_units_per_package, 10) : 1,
      carton_dimensions: formData.carton_dimensions.trim() || null,
      carton_weight: formData.carton_weight.trim() || null,
      carton_size_assortment: formData.carton_size_assortment.trim() || null,
      packaging_included_in_price: formData.packaging_included_in_price,
      packaging_notes: formData.packaging_notes.trim() || null,
      seo_title: formData.seo_title.trim() || null,
      seo_description: formData.seo_description.trim() || null,
      variants: variants.map((v, idx) => ({
        ...v,
        display_order: idx,
      })),
      images: images.filter((img) => img.image_url),
    };

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
        }, 1000);
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/dashboard/products')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to products list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit: ${formData.name || 'Footwear Article'}` : 'New Wholesale Product'}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  formData.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {formData.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isEdit ? 'Update colour variants, carton specs, and wholesale terms.' : 'Add article, colourways, and packaging curves.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {isEdit && initialProduct?.slug && (
            <Link
              href={`/products/${initialProduct.slug}`}
              target="_blank"
              className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Public View
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Publish Product
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {serverError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-rose-600" />
          <span>{serverError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center">
              Basic Product Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Apex Continental Oxford"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-colors ${
                    errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Slug (URL Key) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="apex-continental-oxford"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  {errors.slug && <p className="text-xs text-rose-600 mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Master Article / SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, sku: e.target.value });
                    }}
                    placeholder="APX-701"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, category_id: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Brand / Manufacturer
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBrandModalOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Quick Add Brand
                    </button>
                  </div>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, brand_id: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">No Brand Assigned</option>
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Short Summary (Listing Description)
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, short_description: e.target.value });
                  }}
                  placeholder="e.g. Classic Goodyear-welted derby shoe crafted with supple top-grain leather."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Description & Commercial Specifications
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, description: e.target.value });
                  }}
                  placeholder="Detailed product information for wholesale retail buyers..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Upper / Sole Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, material: e.target.value });
                    }}
                    placeholder="e.g. Full-Grain Cow Leather / TPR Sole"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Available Size Range
                  </label>
                  <input
                    type="text"
                    value={formData.available_sizes}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, available_sizes: e.target.value });
                    }}
                    placeholder="6, 7, 8, 9, 10, 11"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-2 mt-1.5">
                    {['6, 7, 8, 9, 10', '7, 8, 9, 10, 11', '4, 5, 6, 7, 8', '39, 40, 41, 42, 43, 44'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setFormData({ ...formData, available_sizes: preset });
                        }}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Colour Variants & Swatch Manager */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Palette className="w-4 h-4 mr-2 text-blue-600" />
                  Colour Variants & Swatches
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage multiple colour options with swatch hex codes, textures, and variant SKUs.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Colour
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between"
                >
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    {/* Visual Color Swatch Picker */}
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={v.hex_code || '#000000'}
                        onChange={(e) => updateVariant(idx, 'hex_code', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                        title="Pick colour swatch"
                      />
                    </div>

                    <div className="flex-1 md:w-44">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Colour Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={v.colour_name}
                        onChange={(e) => updateVariant(idx, 'colour_name', e.target.value)}
                        placeholder="e.g. Tan, Oxblood"
                        className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto flex-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Hex Code
                      </label>
                      <input
                        type="text"
                        value={v.hex_code || ''}
                        onChange={(e) => updateVariant(idx, 'hex_code', e.target.value)}
                        placeholder="#8B4513"
                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Pattern / Finish
                      </label>
                      <input
                        type="text"
                        value={v.pattern || ''}
                        onChange={(e) => updateVariant(idx, 'pattern', e.target.value)}
                        placeholder="e.g. Suede, Patent"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Variant SKU
                      </label>
                      <input
                        type="text"
                        value={v.variant_sku || ''}
                        onChange={(e) => updateVariant(idx, 'variant_sku', e.target.value)}
                        placeholder="APX-701-TAN"
                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {/* Quick photo upload button for this variant */}
                    <label className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer" title="Upload photo for this colour">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, v.id)}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      disabled={variants.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Product Photographs & Variant Tagging */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Product Photographs & Colour Mapping
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload multiple photos. Assign each photo to a specific colour variant or make it general.
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-48">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Assign To Colour
                  </label>
                  <select
                    value={imageVariantTarget}
                    onChange={(e) => setImageVariantTarget(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="all">All Colours (General)</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id || ''}>
                        {v.colour_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex gap-2 w-full">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={addImageFromUrl}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Add URL
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1.5" />
                    )}
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => {
                const assignedVariant = variants.find((v) => v.id === img.variant_id);
                return (
                  <div
                    key={img.id || idx}
                    className="relative group bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col"
                  >
                    <div className="aspect-square relative w-full overflow-hidden bg-white">
                      <Image
                        src={img.image_url || ''}
                        alt={img.alt_text || 'Product image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {img.is_primary && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-white border-t border-slate-200 space-y-1.5">
                      <select
                        value={img.variant_id || 'all'}
                        onChange={(e) =>
                          updateImageVariant(idx, e.target.value === 'all' ? null : e.target.value)
                        }
                        className="w-full text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 outline-none"
                      >
                        <option value="all">All Colours (General)</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id || ''}>
                            {v.colour_name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between pt-1">
                        {!img.is_primary ? (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Set Primary
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                            <Star className="w-3 h-3 mr-0.5 fill-emerald-600" />
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Configurable Packaging & Carton Logistics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Boxes className="w-4 h-4 mr-2 text-blue-600" />
                Configurable Wholesale Packaging & Carton Specifications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure Master Carton or alternate packaging (Polybag, Shoe Box, Bundle). Footwear is never forced to default to a box.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Wholesale Packaging Type
                  </label>
                  <select
                    value={formData.packaging_type_id}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, packaging_type_id: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">No Packaging Specification Set</option>
                    {packagingList.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} {pt.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pairs Per Master Carton
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.packaging_pairs_per_carton}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, packaging_pairs_per_carton: e.target.value });
                    }}
                    placeholder="e.g. 12, 24, 36"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Units Per Package
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.packaging_units_per_package}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, packaging_units_per_package: e.target.value });
                    }}
                    placeholder="1 pair per unit"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Carton Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    value={formData.carton_dimensions}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, carton_dimensions: e.target.value });
                    }}
                    placeholder="e.g. 60 x 45 x 35 cm"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gross Carton Weight
                  </label>
                  <input
                    type="text"
                    value={formData.carton_weight}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, carton_weight: e.target.value });
                    }}
                    placeholder="e.g. 14.5 kg"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Carton Size Assortment Curve
                </label>
                <input
                  type="text"
                  value={formData.carton_size_assortment}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, carton_size_assortment: e.target.value });
                  }}
                  placeholder="e.g. Size 7: 2 pairs | Size 8: 3 pairs | Size 9: 4 pairs | Size 10: 3 pairs"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.packaging_included_in_price}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, packaging_included_in_price: e.target.checked });
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Packaging is included in quoted wholesale price (no extra packaging surcharge)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Packaging / Logistics Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.packaging_notes}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, packaging_notes: e.target.value });
                  }}
                  placeholder="e.g. Moisture silica gel sachets inside each bag; poly-strapped carton."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (1 span) */}
        <div className="space-y-6">
          {/* Section 5: Wholesale Pricing & Commercial Terms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Commercial Terms
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Wholesale Price Per Pair (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesale_price}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, wholesale_price: e.target.value });
                  }}
                  placeholder="e.g. 850"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Price Display Visibility
                </label>
                <select
                  value={formData.price_visibility}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, price_visibility: e.target.value as PriceVisibility });
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none bg-white"
                >
                  <option value="contact">&ldquo;Price on Request / Contact&rdquo; (Recommended)</option>
                  <option value="public">Visible to Public Buyers</option>
                  <option value="hidden">Hidden completely</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Order Quantity (MOQ Pairs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.moq}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, moq: e.target.value });
                  }}
                  placeholder="12"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Usually matches 1 master carton ({formData.packaging_pairs_per_carton || 12} pairs).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Stock / Production Status
                </label>
                <select
                  value={formData.availability_status}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, availability_status: e.target.value as AvailabilityStatus });
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 outline-none bg-white font-medium"
                >
                  <option value="in_stock">Ready in Stock</option>
                  <option value="made_to_order">Made to Order (Lead Time)</option>
                  <option value="low_stock">Limited Stock Remaining</option>
                  <option value="out_of_stock">Temporarily Out of Stock</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData({ ...formData, is_featured: e.target.checked });
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Feature on Homepage Carousel
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: SEO Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              SEO & Discoverability
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, seo_title: e.target.value });
                  }}
                  placeholder={formData.name || 'Title for Google Search'}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={formData.seo_description}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData({ ...formData, seo_description: e.target.value });
                  }}
                  placeholder="Wholesale supplier of men's leather formal shoes with direct factory carton delivery..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center">
                <Tag className="w-4 h-4 mr-2 text-blue-600" />
                Quick Add Brand
              </h3>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickBrandCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => {
                    setNewBrandName(e.target.value);
                    if (!newBrandSlug) {
                      setNewBrandSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. Apex Walk"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={newBrandSlug}
                  onChange={(e) => setNewBrandSlug(e.target.value)}
                  placeholder="apex-walk"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBrand}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {isCreatingBrand ? 'Saving...' : 'Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
