import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Package, Truck, RotateCcw, FileText } from 'lucide-react';
import { getBusinessSettings } from '@/lib/data-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: `Wholesale Terms & Conditions | ${settings.business_name}`,
    description: `Standard B2B wholesale policies, Minimum Order Quantity (MOQ), road transport dispatch, and return procedures for ${settings.business_name}.`,
    alternates: {
      canonical: '/terms',
    },
  };
}

export default async function TermsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
          B2B Commercial Policy
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Wholesale Terms & Conditions
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Effective for all wholesale carton orders and dealership agreements with {settings.business_name}.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1: General Wholesale Terms */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <FileText className="w-5 h-5 text-blue-900" />
            <h2>1. General B2B Wholesale Terms</h2>
          </div>
          <div className="prose text-sm text-slate-600 whitespace-pre-line">
            {settings.wholesale_terms}
          </div>
        </section>

        {/* Section 2: Minimum Order Quantity (MOQ) */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Package className="w-5 h-5 text-amber-500" />
            <h2>2. Minimum Order Quantity (MOQ) Policy</h2>
          </div>
          <div className="prose text-sm text-slate-600 whitespace-pre-line">
            {settings.moq_policy}
          </div>
        </section>

        {/* Section 3: Shipping & Transport Logistics */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2>3. Transport, Bilty & Freight Dispatch</h2>
          </div>
          <div className="prose text-sm text-slate-600 whitespace-pre-line">
            {settings.shipping_info}
          </div>
        </section>

        {/* Section 4: Return & Damaged Goods */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h2>4. Damaged Goods & Discrepancy Claims</h2>
          </div>
          <div className="prose text-sm text-slate-600 whitespace-pre-line">
            {settings.return_policy}
          </div>
        </section>
      </div>

      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Questions about custom terms?</span>
        <Link href="/contact" className="font-semibold text-blue-900 hover:underline">
          Contact Wholesale Helpdesk &rarr;
        </Link>
      </div>
    </div>
  );
}
