'use client';

import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Package, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  X, 
  Clock 
} from 'lucide-react';
import { Enquiry, EnquiryStatus } from '@/lib/types';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
      const data = await res.json();
      setEnquiries(data || []);

      // If drawer is open, refresh selected enquiry
      if (selectedEnquiry) {
        const refreshed = (data || []).find((e: Enquiry) => e.id === selectedEnquiry.id);
        if (refreshed) setSelectedEnquiry(refreshed);
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to load enquiries' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const handleUpdateStatus = async (id: string, newStatus: EnquiryStatus, followUpDate?: string | null) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, follow_up_date: followUpDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: 'success', message: 'Enquiry updated successfully' });
      fetchEnquiries();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewNote('');
      fetchEnquiries();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: 'success', message: 'Enquiry deleted' });
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Enquiries & Leads
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track quotation proformas, retail shop leads, and follow-up schedules.
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by buyer name, shop name, phone, or city..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950 bg-slate-50/50"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'New', value: 'new' },
            { label: 'Contacted', value: 'contacted' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Converted', value: 'converted' },
            { label: 'Closed', value: 'closed' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-blue-950 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-900" />
            <span>Loading enquiries...</span>
          </div>
        ) : enquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Buyer & Shop</th>
                  <th className="px-5 py-3">Phone & City</th>
                  <th className="px-5 py-3">Enquiry Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Follow-up Date</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <tr
                    key={enq.id}
                    onClick={() => setSelectedEnquiry(enq)}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                      selectedEnquiry?.id === enq.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{enq.name}</span>
                      {enq.shop_name && (
                        <span className="text-[11px] text-slate-500 block">{enq.shop_name}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-slate-800 block font-semibold">{enq.phone}</span>
                      <span className="text-slate-500">{enq.city}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="capitalize font-medium text-slate-800">
                        {enq.enquiry_type.replace('_', ' ')}
                      </span>
                      {enq.product_name && (
                        <span className="text-[11px] text-blue-900 block truncate max-w-xs">
                          {enq.product_name}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          enq.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : enq.status === 'contacted'
                            ? 'bg-amber-100 text-amber-800'
                            : enq.status === 'in_progress'
                            ? 'bg-purple-100 text-purple-800'
                            : enq.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enq.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 font-mono">
                      {enq.follow_up_date || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(enq.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEnquiry(enq.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Enquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No enquiries match the current filters.
          </div>
        )}
      </div>

      {/* Selected Enquiry Details Drawer / Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Enquiry Details
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedEnquiry.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Status & Follow-up Controls */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Lead Status
                    </label>
                    <select
                      value={selectedEnquiry.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          selectedEnquiry.id,
                          e.target.value as EnquiryStatus,
                          selectedEnquiry.follow_up_date
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="converted">Converted (Order Placed)</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={selectedEnquiry.follow_up_date || ''}
                      onChange={(e) =>
                        handleUpdateStatus(
                          selectedEnquiry.id,
                          selectedEnquiry.status,
                          e.target.value || null
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 border-b border-slate-100 pb-5">
                <span className="font-bold text-slate-900 block uppercase tracking-wider">
                  Customer Contact Card
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center text-slate-700">
                    <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="font-semibold text-blue-900 hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </div>

                  <div className="flex items-center text-slate-700">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{selectedEnquiry.city}</span>
                  </div>

                  {selectedEnquiry.shop_name && (
                    <div className="flex items-center text-slate-700 col-span-2">
                      <Building2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span>{selectedEnquiry.shop_name}</span>
                    </div>
                  )}

                  {selectedEnquiry.email && (
                    <div className="flex items-center text-slate-700 col-span-2">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-900 hover:underline">
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Message */}
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <span className="font-bold text-slate-900 block uppercase tracking-wider">
                  Enquiry Requirement
                </span>
                {selectedEnquiry.product_name && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-700 font-semibold uppercase block">
                        Target Footwear Article
                      </span>
                      <span className="font-bold text-blue-950 block">{selectedEnquiry.product_name}</span>
                    </div>
                    {selectedEnquiry.sku && (
                      <span className="font-mono text-xs text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                        {selectedEnquiry.sku}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Private Internal Notes (Admin Only) */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 block uppercase tracking-wider">
                  Internal Notes (Private)
                </span>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log quotation sent, GST verification notes, transport preference..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNote.trim()}
                      className="px-3 py-1.5 rounded-md bg-blue-950 text-white font-semibold hover:bg-blue-900 disabled:opacity-50"
                    >
                      {isSubmittingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2 pt-2">
                  {selectedEnquiry.notes && selectedEnquiry.notes.length > 0 ? (
                    selectedEnquiry.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-slate-800 space-y-1">
                        <p className="leading-relaxed">{note.note}</p>
                        <span className="text-[10px] text-slate-400 block">
                          {note.author_name || 'Admin'} • {new Date(note.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No internal notes added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
