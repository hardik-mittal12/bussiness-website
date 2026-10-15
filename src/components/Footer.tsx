import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import { BusinessSettings } from '@/lib/types';
import { generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

interface FooterProps {
  settings: BusinessSettings;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const waUrl = generateGeneralWhatsAppUrl(settings.whatsapp_number);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Business Info Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-amber-300 font-bold text-lg">
                AF
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                {settings.business_name}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.tagline || 'Specialized B2B wholesale footwear supply for retail store owners, independent dealers, and bulk buyers across India.'}
            </p>
            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5 fill-current" />
                <span>Direct WhatsApp Wholesale Desk</span>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Wholesale Catalogue
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="text-slate-400 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=mens-formal" className="text-slate-400 hover:text-white transition-colors">
                  Men&apos;s Formal Footwear
                </Link>
              </li>
              <li>
                <Link href="/products?category=mens-sports" className="text-slate-400 hover:text-white transition-colors">
                  Men&apos;s Sports & Sneakers
                </Link>
              </li>
              <li>
                <Link href="/products?category=slippers-slides" className="text-slate-400 hover:text-white transition-colors">
                  EVA Slippers & Slides
                </Link>
              </li>
              <li>
                <Link href="/products?category=kids-school" className="text-slate-400 hover:text-white transition-colors">
                  Kids & School Shoes
                </Link>
              </li>
              <li>
                <Link href="/products?category=womens-flats" className="text-slate-400 hover:text-white transition-colors">
                  Women&apos;s Flats & Ethnic
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Legal Information */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Wholesale Information
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Wholesale Terms & MOQ Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Our Business
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Request Dealership / Catalogue
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  <span>Admin Staff Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Wholesale Contact
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {settings.address && (
                <li className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {settings.address}
                    {settings.city ? `, ${settings.city}` : ''}
                    {settings.state ? `, ${settings.state}` : ''}
                    {settings.pincode ? ` - ${settings.pincode}` : ''}
                  </span>
                </li>
              )}
              {settings.phone && (
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.business_hours && (
                <li className="flex items-start">
                  <Clock className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                  <span>{settings.business_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>
            &copy; {currentYear} {settings.business_name}. All rights reserved. Wholesale B2B supply only.
          </p>
          <div className="flex items-center space-x-6">
            <span className="inline-flex items-center text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Verified Wholesale Terms
            </span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
