import React from 'react';
import { Metadata } from 'next';
import { getBusinessSettings } from '@/lib/data-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: `Privacy Policy | ${settings.business_name}`,
    description: `Privacy policy detailing how business and enquiry data is handled by ${settings.business_name}.`,
    alternates: {
      canonical: '/privacy',
    },
  };
}

export default async function PrivacyPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Last updated: October 2026 • {settings.business_name}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 leading-relaxed bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">1. Information We Collect</h2>
          <p>
            When you submit an enquiry through our wholesale website, we collect your contact information including your name, shop or business name, telephone/WhatsApp number, city, and message details. We collect this information solely to process your wholesale price enquiry, verify business eligibility, and facilitate transport bilty logistics.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">2. Use of Business Information</h2>
          <p>
            Your details are used exclusively for B2B wholesale communication, providing carton rates, checking lot availability, and coordinating transport dispatch. We do not sell, rent, or trade your contact data to third-party marketing companies.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">3. WhatsApp Communications</h2>
          <p>
            Clicking on WhatsApp enquiry buttons opens the official WhatsApp application using click-to-chat links. WhatsApp chats are encrypted and governed by WhatsApp&apos;s independent terms and privacy policy.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Security</h2>
          <p>
            Enquiry data submitted through our forms is stored in secure database infrastructure protected by strict Row Level Security (RLS) policies. Only authenticated administrators can access enquiry records and proforma information.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">5. Contact Information</h2>
          <p>
            For any privacy-related requests or data correction, please email our administrative desk at{' '}
            <strong className="text-slate-900">{settings.email || 'wholesale@apexfootwear.example.com'}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
