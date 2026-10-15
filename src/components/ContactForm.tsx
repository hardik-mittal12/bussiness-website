'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { enquirySchema, EnquiryFormData } from '@/lib/validation';

interface ContactFormProps {
  defaultEnquiryType?: 'general' | 'product' | 'catalogue' | 'bulk_pricing';
  productId?: string | null;
  productName?: string | null;
  sku?: string | null;
}

export default function ContactForm({
  defaultEnquiryType = 'general',
  productId,
  productName,
  sku,
}: ContactFormProps) {
  const [formData, setFormData] = useState<Partial<EnquiryFormData>>({
    name: '',
    shop_name: '',
    phone: '',
    email: '',
    city: '',
    enquiry_type: defaultEnquiryType,
    product_id: productId || '',
    product_name: productName || '',
    sku: sku || '',
    message: productName 
      ? `Hello, I am interested in wholesale supply for ${productName}${sku ? ` (Code: ${sku})` : ''}. Please share wholesale price slabs, available sizes, and dispatch timeline.`
      : '',
    website_hp: '', // Honeypot spam trap
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate using Zod schema
    const result = enquirySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.');
      }

      setSubmitSuccess(true);
      setFormData({
        name: '',
        shop_name: '',
        phone: '',
        email: '',
        city: '',
        enquiry_type: defaultEnquiryType,
        product_id: productId || '',
        product_name: productName || '',
        sku: sku || '',
        message: '',
        website_hp: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try contacting via WhatsApp or phone.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Enquiry Received</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Thank you for reaching out. Our wholesale desk will review your requirements and contact you via phone or WhatsApp with carton rates and availability.
        </p>
        <button
          type="button"
          onClick={() => setSubmitSuccess(false)}
          className="mt-5 inline-flex items-center px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field - visually hidden to trap bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_hp">Leave this empty</label>
        <input
          type="text"
          id="website_hp"
          name="website_hp"
          value={formData.website_hp || ''}
          onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Your Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ramesh Kumar"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-hidden focus:ring-2 ${
              errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'
            }`}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        {/* Shop Name */}
        <div>
          <label htmlFor="shop_name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Business / Shop Name <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="shop_name"
            value={formData.shop_name || ''}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            placeholder="e.g. Kumar Footwear Store"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Phone / WhatsApp Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-hidden focus:ring-2 ${
              errors.phone ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'
            }`}
          />
          {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            City / Town <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            required
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Lucknow, Varanasi, Jaipur"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-hidden focus:ring-2 ${
              errors.city ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'
            }`}
          />
          {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. shop@example.com"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-hidden focus:ring-2 ${
              errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'
            }`}
          />
          {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
        </div>

        {/* Enquiry Type */}
        <div>
          <label htmlFor="enquiry_type" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Enquiry Type
          </label>
          <select
            id="enquiry_type"
            value={formData.enquiry_type || 'general'}
            onChange={(e) => setFormData({ ...formData, enquiry_type: e.target.value as EnquiryFormData['enquiry_type'] })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900"
          >
            <option value="general">General Wholesale Enquiry</option>
            <option value="product">Specific Product Enquiry</option>
            <option value="catalogue">Request Full Catalogue & Price List</option>
            <option value="bulk_pricing">Bulk / Multi-Carton Volume Order</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Requirement Details <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="message"
          rows={4}
          required
          value={formData.message || ''}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please mention the articles of interest, approximate carton quantities, target delivery location, or any specific requirements."
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white focus:outline-hidden focus:ring-2 ${
            errors.message ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-900'
          }`}
        />
        {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-950"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Submitting Enquiry...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            <span>Send Wholesale Enquiry</span>
          </>
        )}
      </button>
    </form>
  );
}
