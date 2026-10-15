import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  Layers, 
  Inbox, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  FileEdit, 
  Building2, 
  Clock 
} from 'lucide-react';
import { getDashboardMetrics } from '@/lib/data-service';

export default async function AdminDashboardOverviewPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog metrics and incoming wholesale retail enquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard/products/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Footwear Article
          </Link>
        </div>
      </div>

      {/* Metric Cards (100% Backed by Real Database Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Published Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Published Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.publishedProducts}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-1 font-medium">
              Live on public catalogue
            </span>
          </div>
        </div>

        {/* Draft Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Draft / Unpublished
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.draftProducts}
            </span>
            <span className="text-[11px] text-amber-700 block mt-1 font-medium">
              Hidden from public search & sitemap
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.totalCategories}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Organized footwear lines
            </span>
          </div>
        </div>

        {/* Total Enquiries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Wholesale Enquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.totalEnquiries}
            </span>
            <span className="text-[11px] text-purple-700 block mt-1 font-medium">
              Form submissions in database
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/dashboard/products"
          className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-xs transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Package className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-900">
                Manage Footwear Catalog
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Add new footwear articles, update carton packing quantities, adjust wholesale prices, and upload photographs.
          </p>
        </Link>

        <Link
          href="/admin/dashboard/enquiries"
          className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-xs transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Inbox className="w-5 h-5 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700">
                Retail Enquiry Inbox
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review incoming retailer requests, record internal follow-up notes, and track quotation conversion stages.
          </p>
        </Link>

        <Link
          href="/admin/dashboard/business-settings"
          className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-xs transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Building2 className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600">
                Business Info & Terms
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure contact numbers, WhatsApp click-to-chat targets, hero banners, transport terms, and MOQ policies.
          </p>
        </Link>
      </div>

      {/* Recent Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Recent Retailer Enquiries
            </h2>
          </div>
          <Link
            href="/admin/dashboard/enquiries"
            className="text-xs font-semibold text-blue-900 hover:text-blue-700"
          >
            View All Enquiries &rarr;
          </Link>
        </div>

        {metrics.recentEnquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Customer / Shop</th>
                  <th className="px-6 py-3">Phone & City</th>
                  <th className="px-6 py-3">Enquiry Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-900 block">{enq.name}</span>
                      {enq.shop_name && (
                        <span className="text-[11px] text-slate-500 block">{enq.shop_name}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-slate-800 block">{enq.phone}</span>
                      <span className="text-slate-500">{enq.city}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="capitalize font-medium text-slate-700">
                        {enq.enquiry_type.replace('_', ' ')}
                      </span>
                      {enq.product_name && (
                        <span className="text-[11px] text-blue-900 block truncate max-w-xs">
                          {enq.product_name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          enq.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : enq.status === 'contacted'
                            ? 'bg-amber-100 text-amber-800'
                            : enq.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {enq.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(enq.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No incoming customer enquiries logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
