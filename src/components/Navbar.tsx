'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, MessageCircle } from 'lucide-react';
import { generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

interface NavbarProps {
  businessName?: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  logoUrl?: string | null;
}

export default function Navbar({
  businessName = 'Shiv Ganga Traders',
  phone,
  whatsappNumber,
  logoUrl,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const initials = businessName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SG';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Product Catalogue', href: '/products' },
    { label: 'About Us', href: '/about' },
    { label: 'Wholesale Terms', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ];

  const waUrl = generateGeneralWhatsAppUrl(whatsappNumber);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              {logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-slate-200 bg-white shadow-2xs shrink-0">
                  <Image
                    src={logoUrl}
                    alt={businessName}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center text-amber-400 font-bold text-lg shadow-2xs group-hover:bg-blue-900 transition-colors shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <span className="font-bold text-xl tracking-tight text-blue-950 block">
                  {businessName}
                </span>
                <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase block -mt-1">
                  Wholesale Footwear
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-950 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:text-blue-950 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="hidden lg:flex items-center text-xs font-semibold text-slate-600 hover:text-blue-950 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                title="Call Wholesale Desk"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5 text-blue-950" />
                <span>{phone}</span>
              </a>
            )}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#25D366] hover:bg-[#20ba59] rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
            >
              <MessageCircle className="w-4 h-4 mr-1.5 fill-current" />
              <span>Wholesale Enquiry</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-blue-950 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-950"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'text-blue-950 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-[#25D366] hover:bg-[#20ba59] rounded-lg shadow-xs"
            >
              <MessageCircle className="w-5 h-5 mr-2 fill-current" />
              <span>Wholesale WhatsApp Enquiry</span>
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                <Phone className="w-4 h-4 mr-2 text-slate-600" />
                <span>Call {phone}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
