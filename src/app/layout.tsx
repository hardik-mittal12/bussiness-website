import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getBusinessSettings } from '@/lib/data-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();

  const title = `${settings.business_name} | Wholesale Footwear Supplier & Distributor`;
  const description = settings.tagline || 
    'Direct wholesale footwear supplier in India. Bulk footwear collections for men, women, and kids in standard carton assortments with pan-India transport delivery.';

  return {
    title: {
      default: title,
      template: `%s | ${settings.business_name}`,
    },
    description,
    keywords: [
      'wholesale footwear',
      'footwear distributor India',
      'bulk shoes wholesale',
      'shoe manufacturer lot',
      'sports shoes wholesale',
      'formal shoes bulk',
      'wholesale footwear market',
    ],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wholesale-footwear.example.com'),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_IN',
      siteName: settings.business_name,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getBusinessSettings();

  // Organization JSON-LD Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.business_name,
    description: settings.tagline || 'Wholesale Footwear Distributor',
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    address: settings.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.address,
          addressLocality: settings.city || undefined,
          addressRegion: settings.state || undefined,
          postalCode: settings.pincode || undefined,
          addressCountry: 'IN',
        }
      : undefined,
  };

  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-800 antialiased selection:bg-blue-900 selection:text-white">
        <Navbar
          businessName={settings.business_name}
          phone={settings.phone}
          whatsappNumber={settings.whatsapp_number}
        />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
        <WhatsAppButton
          variant="floating"
          phoneNumber={settings.whatsapp_number}
        />
      </body>
    </html>
  );
}
