'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Save, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  FileText, 
  Package, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Upload,
  Trash2,
  ImageIcon
} from 'lucide-react';
import { BusinessSettings } from '@/lib/types';

export default function AdminBusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    tagline: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    business_hours: '',
    service_areas: '',
    hero_headline: '',
    hero_subheadline: '',
    hero_image_url: '',
    about_intro: '',
    about_history: '',
    wholesale_terms: '',
    moq_policy: '',
    shipping_info: '',
    return_policy: '',
    analytics_google_id: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data: BusinessSettings = await res.json();
      setFormData({
        business_name: data.business_name || '',
        tagline: data.tagline || '',
        phone: data.phone || '',
        whatsapp_number: data.whatsapp_number || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        business_hours: data.business_hours || '',
        service_areas: (data.service_areas || []).join(', '),
        hero_headline: data.hero_headline || '',
        hero_subheadline: data.hero_subheadline || '',
        hero_image_url: data.hero_image_url || '',
        about_intro: data.about_intro || '',
        about_history: data.about_history || '',
        wholesale_terms: data.wholesale_terms || '',
        moq_policy: data.moq_policy || '',
        shipping_info: data.shipping_info || '',
        return_policy: data.return_policy || '',
        analytics_google_id: data.analytics_google_id || '',
      });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to load business settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    const areasArray = formData.service_areas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service_areas: areasArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setNotification({
        type: 'success',
        message: 'Business information and wholesale terms updated successfully!',
      });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFormData((prev) => ({ ...prev, hero_image_url: data.url }));
      setNotification({ type: 'success', message: 'Hero banner photo uploaded successfully! Click "Save & Publish Changes" to commit.' });
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Hero photo upload failed',
      });
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-900" />
        <span>Loading business settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Information & Wholesale Terms
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure contact coordinates, WhatsApp numbers, homepage copy, and wholesale policies without touching code.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save & Publish Changes</span>
            </>
          )}
        </button>
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

      {/* 1. Core Identity & Contact Channels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-blue-950" />
          <span>Core Business Identity & Public Contact</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Business Legal / Trading Name
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Number (For Click-to-Chat)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="e.g. 919876543210"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
              <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Format: Country code + digits without spaces (e.g. 919876543210)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Telephone / Call Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
              <Phone className="w-4 h-4 text-blue-900 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Business Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="wholesale@example.com"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Physical Depot Location Details */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Wholesale Depot / Street Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Commercial Market, Industrial Area"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City / Market Hub
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chandigarh, Agra, Delhi"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / Territory
              </label>
              <input
                type="text"
                list="indian-states-list"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Chandigarh, Punjab, Delhi"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
              <datalist id="indian-states-list">
                <option value="Andaman and Nicobar Islands" />
                <option value="Andhra Pradesh" />
                <option value="Arunachal Pradesh" />
                <option value="Assam" />
                <option value="Bihar" />
                <option value="Chandigarh" />
                <option value="Chhattisgarh" />
                <option value="Dadra and Nagar Haveli and Daman and Diu" />
                <option value="Delhi NCR" />
                <option value="Goa" />
                <option value="Gujarat" />
                <option value="Haryana" />
                <option value="Himachal Pradesh" />
                <option value="Jammu and Kashmir" />
                <option value="Jharkhand" />
                <option value="Karnataka" />
                <option value="Kerala" />
                <option value="Ladakh" />
                <option value="Lakshadweep" />
                <option value="Madhya Pradesh" />
                <option value="Maharashtra" />
                <option value="Manipur" />
                <option value="Meghalaya" />
                <option value="Mizoram" />
                <option value="Nagaland" />
                <option value="Odisha" />
                <option value="Puducherry" />
                <option value="Punjab" />
                <option value="Rajasthan" />
                <option value="Sikkim" />
                <option value="Tamil Nadu" />
                <option value="Telangana" />
                <option value="Tripura" />
                <option value="Uttar Pradesh" />
                <option value="Uttarakhand" />
                <option value="West Bengal" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pincode / Postal Code
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 160017"
                maxLength={10}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Operating / Business Hours
            </label>
            <input
              type="text"
              value={formData.business_hours}
              onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
              placeholder="e.g. Monday to Saturday: 10:00 AM – 8:00 PM (Sunday Closed)"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Service Areas / Transport Corridors (Comma separated)
          </label>
          <input
            type="text"
            value={formData.service_areas}
            onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
            placeholder="Pan-India Transport, North India, Punjab & Haryana, Delhi NCR, Rajasthan..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>
      </div>

      {/* 2. Homepage Hero Showcase */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
          <span>Homepage Hero Banner</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Hero Headline
          </label>
          <input
            type="text"
            value={formData.hero_headline}
            onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Hero Supporting Description
          </label>
          <textarea
            rows={2}
            value={formData.hero_subheadline}
            onChange={(e) => setFormData({ ...formData, hero_subheadline: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Hero Showcase Image
          </label>

          {formData.hero_image_url ? (
            <div className="relative mb-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-w-lg shadow-2xs">
              <div className="relative aspect-16/9 w-full bg-slate-100">
                <Image
                  src={formData.hero_image_url}
                  alt="Hero Banner Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <span className="font-mono text-[11px] text-slate-500 truncate" title={formData.hero_image_url}>
                  {formData.hero_image_url}
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hero_image_url: '' })}
                  className="inline-flex items-center text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1 hover:bg-rose-50 rounded transition-colors shrink-0"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 mb-3 max-w-lg">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No hero image configured yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload a high-quality photograph of your footwear collection or wholesale depot.</p>
            </div>
          )}

          <div className="space-y-2 max-w-lg">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center justify-center px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs transition-colors">
                {uploadingHero ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Uploading Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload New Hero Photo
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleHeroFileUpload}
                  className="hidden"
                  disabled={uploadingHero}
                />
              </label>

              <span className="text-xs text-slate-400">or enter image URL directly below</span>
            </div>

            <input
              type="url"
              placeholder="https://... or upload photo above"
              value={formData.hero_image_url}
              onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
            />
            <p className="text-[10px] text-slate-400">
              Recommended: 1200×800 or 1600×900 aspect ratio. Max file size: 5 MB (WebP, PNG, JPEG, AVIF).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Wholesale Commercial Terms & Policies */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-blue-900" />
          <span>Wholesale Terms & Commercial Policies</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            General Wholesale & Dealership Terms
          </label>
          <textarea
            rows={3}
            value={formData.wholesale_terms}
            onChange={(e) => setFormData({ ...formData, wholesale_terms: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Minimum Order Quantity (MOQ) Policy
          </label>
          <textarea
            rows={2}
            value={formData.moq_policy}
            onChange={(e) => setFormData({ ...formData, moq_policy: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Transport, Logistics & Bilty Policy
          </label>
          <textarea
            rows={2}
            value={formData.shipping_info}
            onChange={(e) => setFormData({ ...formData, shipping_info: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Return, Manufacturing Flaws & Damage Policy
          </label>
          <textarea
            rows={2}
            value={formData.return_policy}
            onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>
      </div>

      {/* 4. About Us Narrative & History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          About Us Content
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Company Introduction
          </label>
          <textarea
            rows={3}
            value={formData.about_intro}
            onChange={(e) => setFormData({ ...formData, about_intro: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            History & Regional Experience
          </label>
          <textarea
            rows={3}
            value={formData.about_history}
            onChange={(e) => setFormData({ ...formData, about_history: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>
      </div>

      {/* 5. Analytics & Verification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Measurement & Verification
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Google Analytics Measurement ID <span className="text-slate-400 font-normal">(Optional, e.g. G-XXXXXXXXXX)</span>
          </label>
          <input
            type="text"
            value={formData.analytics_google_id}
            onChange={(e) => setFormData({ ...formData, analytics_google_id: e.target.value })}
            placeholder="G-XXXXXXXXXX"
            className="w-full max-w-sm px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-950"
          />
        </div>
      </div>

      {/* Bottom Save bar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              <span>Save & Publish All Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
