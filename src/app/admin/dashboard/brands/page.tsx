'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Check, 
  Search,
  Upload,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Brand } from '@/lib/types';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    display_order: 0,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      setBrands(data || []);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to load brands' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setModalFormData({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      display_order: brands.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setModalFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      display_order: brand.display_order,
      is_active: brand.is_active,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setModalFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingBrand
        ? prev.slug
        : val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setModalFormData((prev) => ({ ...prev, logo_url: data.url }));
      setNotification({ type: 'success', message: 'Brand logo uploaded successfully' });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Logo upload failed',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingBrand
        ? `/api/admin/brands/${editingBrand.id}`
        : '/api/admin/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save brand');

      setNotification({
        type: 'success',
        message: `Brand "${modalFormData.name}" ${editingBrand ? 'updated' : 'created'} successfully`,
      });
      setIsModalOpen(false);
      fetchBrands();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete brand');

      setNotification({
        type: 'success',
        message: `Brand "${deleteTarget.name}" deleted successfully`,
      });
      setDeleteTarget(null);
      fetchBrands();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete brand',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !brand.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update brand status');

      setBrands((prev) =>
        prev.map((b) => (b.id === brand.id ? { ...b, is_active: !b.is_active } : b))
      );
      setNotification({
        type: 'success',
        message: `Brand "${brand.name}" is now ${!brand.is_active ? 'active' : 'inactive'}`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const filteredBrands = brands.filter((brand) => {
    const matchesQuery =
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && brand.is_active) ||
      (filterActive === 'inactive' && !brand.is_active);
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-blue-600" />
            Brands & Manufacturers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage footwear brands, manufacturer labels, display order, and active catalogue tags.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm transition-all ${
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
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search brands by name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
          {(['all', 'active', 'inactive'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterActive(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filterActive === mode
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-sm">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Tag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No brands found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first footwear brand.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          {brand.logo_url ? (
                            <Image
                              src={brand.logo_url}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <span className="font-bold text-slate-400 text-sm">
                              {brand.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{brand.name}</div>
                          {brand.description && (
                            <div className="text-xs text-slate-500 truncate max-w-xs">
                              {brand.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {brand.display_order}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {brand.product_count ?? 0} products
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(brand)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          brand.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            brand.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit brand"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(brand)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete brand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Apex Walk, UrbanSole"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Slug (URL Key) *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.slug}
                  onChange={(e) => setModalFormData({ ...modalFormData, slug: e.target.value })}
                  placeholder="apex-walk"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={modalFormData.description}
                  onChange={(e) => setModalFormData({ ...modalFormData, description: e.target.value })}
                  placeholder="Brief description of the brand or label..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Logo
                </label>
                <div className="flex items-center space-x-3">
                  {modalFormData.logo_url && (
                    <div className="w-12 h-12 rounded-lg border border-slate-200 p-1 shrink-0 bg-slate-50 flex items-center justify-center">
                      <Image
                        src={modalFormData.logo_url}
                        alt="Logo Preview"
                        width={40}
                        height={40}
                        className="object-contain max-h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="url"
                      value={modalFormData.logo_url}
                      onChange={(e) => setModalFormData({ ...modalFormData, logo_url: e.target.value })}
                      placeholder="https://... or upload below"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-1.5"
                    />
                    <label className="inline-flex items-center px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={modalFormData.display_order}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, display_order: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Active Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalFormData({ ...modalFormData, is_active: !modalFormData.is_active })}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-2 transition-colors ${
                      modalFormData.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    <Check className={`w-4 h-4 ${modalFormData.is_active ? 'opacity-100' : 'opacity-0'}`} />
                    <span>{modalFormData.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingBrand ? (
                    'Save Changes'
                  ) : (
                    'Create Brand'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Delete Brand &ldquo;{deleteTarget.name}&rdquo;?
              </h3>
              {(deleteTarget.product_count ?? 0) > 0 ? (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800">
                  <p className="font-semibold mb-1">Cannot Delete: Products Assigned</p>
                  <p>
                    There are currently <strong>{deleteTarget.product_count}</strong> product(s) assigned
                    to this brand. To maintain catalogue integrity, you must reassign or remove those
                    products before deleting this brand.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  This action cannot be undone. The brand label will be permanently removed.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {(deleteTarget.product_count ?? 0) === 0 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
