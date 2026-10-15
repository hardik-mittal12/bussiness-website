'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { generateProductWhatsAppUrl, generateGeneralWhatsAppUrl } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phoneNumber?: string | null;
  productName?: string;
  sku?: string | null;
  productUrl?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'floating';
  customText?: string;
  className?: string;
}

export default function WhatsAppButton({
  phoneNumber,
  productName,
  sku,
  productUrl,
  variant = 'primary',
  customText,
  className = '',
}: WhatsAppButtonProps) {
  const url = productName
    ? generateProductWhatsAppUrl({ phoneNumber, productName, sku, productUrl })
    : generateGeneralWhatsAppUrl(phoneNumber, customText);

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2.5 shadow-sm text-sm focus:ring-[#25D366]';
      break;
    case 'secondary':
      variantStyles = 'bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 text-sm focus:ring-slate-400';
      break;
    case 'outline':
      variantStyles = 'border border-[#25D366] text-[#128C7E] hover:bg-emerald-50 px-3 py-1.5 text-xs font-semibold focus:ring-[#25D366]';
      break;
    case 'floating':
      variantStyles = 'fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl focus:ring-[#25D366]';
      break;
  }

  const label = customText || (productName ? 'Enquire on WhatsApp' : 'WhatsApp Enquiry');

  if (variant === 'floating') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2 fill-current" />
      <span>{label}</span>
    </a>
  );
}
