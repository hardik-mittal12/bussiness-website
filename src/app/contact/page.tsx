import React from 'react';
import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle, Building2, Truck } from 'lucide-react';
import { getBusinessSettings } from '@/lib/data-service';
import ContactForm from '@/components/ContactForm';
import { generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: `Contact Wholesale Desk | ${settings.business_name}`,
    description: `Connect with ${settings.business_name} for wholesale footwear enquiries, dealership price lists, carton availability, and bilty transport dispatch.`,
    alternates: {
      canonical: '/contact',
    },
  };
}

export default async function ContactPage() {
  const settings = await getBusinessSettings();
  const waUrl = generateGeneralWhatsAppUrl(settings.whatsapp_number);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
          Wholesale Desk & Enquiries
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Connect With Our Wholesale Team
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Reach out for volume pricing proformas, master carton packing ratios, active lot dispatch, and transport bilty coordination.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Direct Contact Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Direct Contact Details
            </h2>

            <ul className="space-y-4 text-sm">
              {/* WhatsApp */}
              {settings.whatsapp_number && (
                <li className="flex items-start">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Direct WhatsApp Desk
                    </span>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      +{settings.whatsapp_number} (Instant Chat)
                    </a>
                  </div>
                </li>
              )}

              {/* Phone */}
              {settings.phone && (
                <li className="flex items-start">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Telephone / Mobile
                    </span>
                    <a
                      href={`tel:${settings.phone}`}
                      className="font-semibold text-slate-900 hover:text-blue-900 transition-colors"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </li>
              )}

              {/* Email */}
              {settings.email && (
                <li className="flex items-start">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${settings.email}`}
                      className="font-medium text-slate-800 hover:text-blue-900 transition-colors"
                    >
                      {settings.email}
                    </a>
                  </div>
                </li>
              )}

              {/* Address */}
              {settings.address && (
                <li className="flex items-start">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Wholesale Depot Address
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {settings.address}
                      {settings.city ? `, ${settings.city}` : ''}
                      {settings.state ? `, ${settings.state}` : ''}
                      {settings.pincode ? ` - ${settings.pincode}` : ''}
                    </p>
                  </div>
                </li>
              )}

              {/* Business Hours */}
              {settings.business_hours && (
                <li className="flex items-start">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Operating Hours
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {settings.business_hours}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2 text-xs text-blue-950">
            <span className="font-bold uppercase tracking-wider flex items-center">
              <Truck className="w-4 h-4 mr-1.5 text-blue-800" />
              Transport Verification Note
            </span>
            <p className="leading-relaxed">
              If your retail business has a preferred road transport agency (e.g. V-Trans, TCI, ARC, Jaipur Golden, etc.), please mention the depot name in your message for direct bilty booking.
            </p>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
              Wholesale Enquiry Form
            </h2>
            <ContactForm defaultEnquiryType="general" />
          </div>
        </div>
      </div>
    </div>
  );
}
