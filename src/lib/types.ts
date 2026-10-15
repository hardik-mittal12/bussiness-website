export type PublicationStatus = 'draft' | 'published' | 'archived';
export type PriceVisibility = 'public' | 'contact' | 'hidden';
export type AvailabilityStatus = 'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock';
export type EnquiryStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed';
export type UserRole = 'admin' | 'viewer';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  category?: Category | null;
  brand?: Brand | null;
  short_description: string | null;
  description: string | null;
  material: string | null;
  available_sizes: string[];
  color: string | null;
  wholesale_price: number | null;
  price_visibility: PriceVisibility;
  moq: number;
  availability_status: AvailabilityStatus;
  is_featured: boolean;
  status: PublicationStatus;
  seo_title: string | null;
  seo_description: string | null;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface BusinessStrength {
  title: string;
  description: string;
  icon?: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  tagline: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  business_hours: string | null;
  service_areas: string[];
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  about_intro: string | null;
  about_history: string | null;
  about_strengths: BusinessStrength[];
  wholesale_terms: string | null;
  moq_policy: string | null;
  shipping_info: string | null;
  return_policy: string | null;
  social_links: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  analytics_google_id: string | null;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  name: string;
  shop_name: string | null;
  phone: string;
  email: string | null;
  city: string;
  enquiry_type: 'general' | 'product' | 'catalogue' | 'bulk_pricing';
  product_id: string | null;
  product_name: string | null;
  sku: string | null;
  message: string;
  status: EnquiryStatus;
  follow_up_date: string | null;
  notes?: EnquiryNote[];
  created_at: string;
  updated_at: string;
}

export interface EnquiryNote {
  id: string;
  enquiry_id: string;
  author_id: string | null;
  author_name?: string | null;
  note: string;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}
