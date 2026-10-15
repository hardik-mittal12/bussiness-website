'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Check, 
  Star,
  Search,
  ShieldAlert,
  PackageCheck
} from 'lucide-react';
import { PackagingType } from '@/lib/types';

export default function AdminPackagingPage() {
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackagingType | null>(null);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe Delete State
  const [deleteTarget, setDeleteTarget] = useState<PackagingType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPackagingTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/packaging');
      const data = await res.json();
      setPackagingTypes(data || []);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to load packaging types' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagingTypes();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setModalFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      display_order: packagingTypes.length + 1,
      is_active: true,
      is_default: packagingTypes.length === 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: PackagingType) => {
    setEditingPkg(pkg);
    setModalFormData({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description || '',
      image_url: pkg.image_url || '',
      display_order: pkg.display_order,
      is_active: pkg.is_active,
      is_default: pkg.is_default,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setModalFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingPkg
        ? prev.slug
        : val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
    }));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingPkg
        ? `/api/admin/packaging/${editingPkg.id}`
        : '/api/admin/packaging';
      const method = editingPkg ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save packaging type');

      setNotification({
        type: 'success',
        message: `Packaging type "${modalFormData.name}" ${editingPkg ? 'updated' : 'created'} successfully`,
      });
      setIsModalOpen(false);
      fetchPackagingTypes();
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
      const res = await fetch(`/api/admin/packaging/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete packaging type');

      setNotification({
        type: 'success',
        message: `Packaging type "${deleteTarget.name}" deleted successfully`,
      });
      setDeleteTarget(null);
      fetchPackagingTypes();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete packaging type',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (pkg: PackagingType) => {
    try {
      const res = await fetch(`/api/admin/packaging/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !pkg.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update packaging type status');

      setPackagingTypes((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !p.is_active } : p))
      );
      setNotification({
        type: 'success',
        message: `"${pkg.name}" is now ${!pkg.is_active ? 'active' : 'inactive'}`,
      });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const filtered = packagingTypes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Boxes className="w-5 h-5 mr-2 text-blue-600" />
            Configurable Packaging & Carton Types
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define wholesale packaging formats (Master Carton, Polybag, Individual Box, Shrink Wrap). Footwear is never forced to default to a box.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Packaging Type
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

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search packaging types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Packaging Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-sm">Loading packaging options...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No packaging types found</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first wholesale packaging format.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Packaging Type</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Display Order</th>
                  <th className="px-6 py-4">Products Configured</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center">
                            {pkg.name}
                            {pkg.is_default && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Star className="w-2.5 h-2.5 mr-1 fill-amber-500 text-amber-500" />
                                Default
                              </span>
                            )}
                          </div>
                          {pkg.description && (
                            <div className="text-xs text-slate-500 truncate max-w-sm">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {pkg.slug}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {pkg.display_order}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {pkg.product_count ?? 0} products
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(pkg)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          pkg.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            pkg.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit packaging type"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pkg)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete packaging type"
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
                {editingPkg ? 'Edit Packaging Type' : 'Add New Packaging Type'}
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
                  Packaging Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Master Carton, Polybag / Bulk Bag"
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
                  placeholder="master-carton"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  placeholder="Description of packaging, materials, or packaging guidelines..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
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

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalFormData.is_default}
                    onChange={(e) => setModalFormData({ ...modalFormData, is_default: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Set as default packaging type for new products
                  </span>
                </label>
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
                  ) : editingPkg ? (
                    'Save Changes'
                  ) : (
                    'Create Packaging Type'
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
                Delete Packaging Type &ldquo;{deleteTarget.name}&rdquo;?
              </h3>
              {(deleteTarget.product_count ?? 0) > 0 ? (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800">
                  <p className="font-semibold mb-1">Cannot Delete: Products Configured</p>
                  <p>
                    There are currently <strong>{deleteTarget.product_count}</strong> product(s) configured
                    with this packaging type. Please reassign those products to another packaging format
                    first.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  This action cannot be undone. The packaging type will be permanently removed.
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
