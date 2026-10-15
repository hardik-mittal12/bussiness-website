import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, MapPin, Truck, CheckCircle2, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { getBusinessSettings, getCategories } from '@/lib/data-service';
import { generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: `About Us | ${settings.business_name}`,
    description: `Learn about ${settings.business_name}, wholesale footwear supplier in India providing carton lots to independent retailers.`,
    alternates: {
      canonical: '/about',
    },
  };
}

export default async function AboutUsPage() {
  const settings = await getBusinessSettings();
  const categories = await getCategories(false);
  const waUrl = generateGeneralWhatsAppUrl(settings.whatsapp_number);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Header */}
      <section className="bg-linear-to-b from-blue-50/60 to-transparent pt-12 pb-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-2">
            Company Overview
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            About {settings.business_name}
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            {settings.tagline || 'Established Wholesale Footwear Distributor Supplying Retail Stores Across India.'}
          </p>
        </div>
      </section>

      {/* Main Content & Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Reliable Footwear Sourcing for Independent Retailers
            </h2>
            <div className="prose text-sm sm:text-base text-slate-600 space-y-4 leading-relaxed">
              <p>{settings.about_intro}</p>
              <p>{settings.about_history}</p>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Transparent Wholesale Dealing</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Clear ex-warehouse rates, accurate carton size distributions, and verified GST billing without hidden charges.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <Truck className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Hub-to-Hub Transport</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Coordinated bilty dispatches with major transport agencies covering state and regional commercial clusters.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md aspect-4/3 bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80"
                alt="Wholesale Footwear Warehouse Storage"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actual Strengths */}
      {settings.about_strengths && settings.about_strengths.length > 0 && (
        <section className="bg-white py-14 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Operational Strengths
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Core Advantages for Wholesale Buyers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {settings.about_strengths.map((strength, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-[#FAF9F6] space-y-2.5">
                  <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900">
                    Step {idx + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{strength.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{strength.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Areas & Footwear Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service Areas */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-lg">Active Supply Corridors</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We coordinate dispatches daily to transport booking hubs servicing retail centers in the following regions:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {settings.service_areas?.map((area) => (
                <div key={area} className="flex items-center text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center space-x-2.5">
              <Building2 className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-lg">Supplied Footwear Lines</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our active catalogue spans essential high-velocity retail categories in master carton packaging:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-950 bg-slate-50 hover:bg-blue-50 p-2 rounded-lg border border-slate-100 transition-colors"
                >
                  <span className="font-medium">{cat.name}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Connect CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold">Have Questions About Dealership Terms?</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Speak directly with our wholesale representative to check MOQ, carton packing, or bilty logistics.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold shadow-xs"
            >
              <MessageCircle className="w-4 h-4 mr-2 fill-current" />
              <span>WhatsApp Desk</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold shadow-xs"
            >
              Contact Form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
