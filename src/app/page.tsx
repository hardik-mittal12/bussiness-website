import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  MessageCircle, 
  Package, 
  Truck, 
  ShieldCheck, 
  Building2, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';
import { getBusinessSettings, getCategories, getProducts } from '@/lib/data-service';
import ProductCard from '@/components/ProductCard';
import { generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

export default async function HomePage() {
  const settings = await getBusinessSettings();
  const categories = await getCategories(false);
  const { products: featuredProducts } = await getProducts({
    featuredOnly: true,
    status: 'published',
    limit: 6,
  });

  const heroImageUrl = settings.hero_image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80';
  const waUrl = generateGeneralWhatsAppUrl(settings.whatsapp_number);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50/70 via-white to-transparent pt-12 sm:pt-16 pb-16 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-950 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-blue-700 animate-pulse"></span>
                <span>B2B Footwear Wholesale & Dealership</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-[1.15]">
                {settings.hero_headline || 'Direct Wholesale Footwear Supply for Retailers'}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {settings.hero_subheadline ||
                  'Supply your shoe retail store with fast-selling formal, casual, sports, and slide collections in master carton packaging. Transparent wholesale terms, reliable road transport booking, and direct factory-to-store supply.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-950"
                >
                  <span>Explore Product Catalogue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
                >
                  <MessageCircle className="w-4 h-4 mr-2 fill-current" />
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>

              {/* Factual Value Props */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2.5">
                  <Package className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Master Carton Lots (12-24 Pairs)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Daily Road Transport Bilty</span>
                </div>
                <div className="flex items-center space-x-2.5 col-span-2 sm:col-span-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">GST Invoice & Verified Terms</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white aspect-4/3 sm:aspect-5/4">
                <Image
                  src={heroImageUrl}
                  alt="Wholesale Footwear Showcase"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    Retail Wholesale Ready
                  </span>
                  <p className="text-sm font-medium mt-1">
                    Pre-assorted sizes for balanced retail turnover and zero deadstock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
              Product Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Footwear by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-semibold text-blue-900 hover:text-blue-700"
          >
            <span>View Full Catalogue</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                <Image
                  src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 text-center flex-1 flex flex-col justify-center">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
              Top Running Designs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Wholesale Articles
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-sm font-semibold text-blue-900 hover:text-blue-700"
          >
            <span>Browse All {featuredProducts.length > 0 ? 'Articles' : ''}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsappNumber={settings.whatsapp_number}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No featured products configured yet. Explore our complete catalogue below.
          </div>
        )}
      </section>

      {/* 4. Why Buy From Us (Configured Strengths Only) */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
              Wholesale Value
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why Retailers Partner With Us
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Tested wholesale operations designed around the practical requirements of footwear store owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {settings.about_strengths?.map((strength, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-100 bg-[#FAF9F6] space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-slate-900 text-base">{strength.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {strength.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Business Introduction & Service Areas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              About Apex Footwear Wholesale
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Serving Independent Shoe Retailers & Stockists
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings.about_intro}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {settings.about_history}
            </p>

            {/* Service Areas */}
            {settings.service_areas && settings.service_areas.length > 0 && (
              <div className="pt-4">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                  Key Transport Corridors & Service Areas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {settings.service_areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-blue-950 text-white rounded-2xl p-8 space-y-6 shadow-md">
            <div className="flex items-center space-x-3">
              <Building2 className="w-7 h-7 text-amber-400" />
              <h3 className="text-xl font-bold">Wholesale Dealership Desk</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you setting up a new retail showroom or looking to expand your current inventory lines? Connect with our wholesale dispatch team to receive updated master price lists.
            </p>
            <div className="space-y-3 pt-2">
              <Link
                href="/terms"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-900/60 hover:bg-blue-900 text-sm font-medium transition-colors border border-blue-800"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-amber-300" />
                  Review Wholesale MOQ & Terms
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold text-sm transition-colors"
              >
                Request Dealership Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Wholesale Enquiry Call To Action Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-blue-950 to-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Order Footwear in Carton Lots?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Get in touch directly through WhatsApp or submit a formal wholesale enquiry for volume rates, current lot availability, and dispatch through your preferred transport agency.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2 fill-current" />
                <span>Chat on WhatsApp ({settings.phone || 'Wholesale Desk'})</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
              >
                <span>Submit Detailed Requirement Form</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
