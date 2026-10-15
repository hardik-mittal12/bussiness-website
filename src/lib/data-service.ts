import { 
  BusinessSettings, 
  Category, 
  Brand, 
  Product, 
  Enquiry, 
  EnquiryStatus, 
  PublicationStatus, 
  ProductImage,
  PackagingType,
  ProductVariant,
  ProductVariantInput,
  ProductImageInput
} from './types';
import { 
  initialBusinessSettings, 
  initialCategories, 
  initialBrands, 
  initialProducts, 
  initialEnquiries,
  initialPackagingTypes
} from './mock-data';
import { createServerSupabaseClient } from './supabase/server';

// In-memory store for fallback/local execution when Supabase credentials are not yet supplied
class LocalDataStore {
  businessSettings: BusinessSettings = { ...initialBusinessSettings };
  categories: Category[] = [...initialCategories];
  brands: Brand[] = [...initialBrands];
  packagingTypes: PackagingType[] = [...initialPackagingTypes];
  products: Product[] = [...initialProducts];
  enquiries: Enquiry[] = [...initialEnquiries];
}

const globalStore = (globalThis as unknown as { __wholesaleStore?: LocalDataStore });
if (!globalStore.__wholesaleStore) {
  globalStore.__wholesaleStore = new LocalDataStore();
}
const localStore = globalStore.__wholesaleStore;

function isStrictProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('id', 'default')
      .single();
    if (error && isStrictProduction()) {
      console.error('Failed to get business settings from Supabase:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }
    if (!error && data) {
      return data as BusinessSettings;
    }
  }
  return localStore.businessSettings;
}

export async function updateBusinessSettings(updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('business_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 'default')
      .select()
      .single();
    if (error) {
      throw new Error(`Failed to update business settings: ${error.message}`);
    }
    return data as BusinessSettings;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.businessSettings = {
    ...localStore.businessSettings,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return localStore.businessSettings;
}

export async function getCategories(includeInactive = false): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
    if (!error && data) {
      return data as Category[];
    }
  }

  let list = localStore.categories;
  if (!includeInactive) {
    list = list.filter((c) => c.is_active);
  }
  return [...list].sort((a, b) => a.display_order - b.display_order);
}

export async function getBrands(includeInactive = false): Promise<Brand[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase.from('brands').select('*, products(id)').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }
    if (!error && data) {
      return (data as Array<Brand & { products?: { id: string }[] }>).map((b) => ({
        ...b,
        product_count: b.products?.length || 0,
      }));
    }
  }

  let list = localStore.brands;
  if (!includeInactive) {
    list = list.filter((b) => b.is_active);
  }
  return [...list]
    .map((b) => ({
      ...b,
      product_count: localStore.products.filter((p) => p.brand_id === b.id).length,
    }))
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('brands').select('*, products(id)').eq('id', id).single();
    if (error && error.code !== 'PGRST116' && isStrictProduction()) {
      throw new Error(`Failed to fetch brand: ${error.message}`);
    }
    if (!error && data) {
      const b = data as Brand & { products?: { id: string }[] };
      return { ...b, product_count: b.products?.length || 0 };
    }
    return null;
  }
  const found = localStore.brands.find((b) => b.id === id);
  if (!found) return null;
  return {
    ...found,
    product_count: localStore.products.filter((p) => p.brand_id === found.id).length,
  };
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('brands').select('*, products(id)').eq('slug', slug).single();
    if (error && error.code !== 'PGRST116' && isStrictProduction()) {
      throw new Error(`Failed to fetch brand by slug: ${error.message}`);
    }
    if (!error && data) {
      const b = data as Brand & { products?: { id: string }[] };
      return { ...b, product_count: b.products?.length || 0 };
    }
    return null;
  }
  const found = localStore.brands.find((b) => b.slug === slug);
  if (!found) return null;
  return {
    ...found,
    product_count: localStore.products.filter((p) => p.brand_id === found.id).length,
  };
}

export type BrandInput = {
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  display_order?: number;
  is_active?: boolean;
};

export async function createBrand(brandData: BrandInput): Promise<Brand> {
  const supabase = await createServerSupabaseClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newBrand: Brand = {
    ...brandData,
    id,
    description: brandData.description ?? null,
    logo_url: brandData.logo_url ?? null,
    display_order: brandData.display_order ?? 0,
    is_active: brandData.is_active ?? true,
    product_count: 0,
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    const { error } = await supabase.from('brands').insert({
      id: newBrand.id,
      name: newBrand.name,
      slug: newBrand.slug,
      description: newBrand.description,
      logo_url: newBrand.logo_url,
      display_order: newBrand.display_order,
      is_active: newBrand.is_active,
    });
    if (error) throw new Error(`Brand creation failed: ${error.message}`);
    return newBrand;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.brands.push(newBrand);
  return newBrand;
}

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from('brands')
      .update({ ...updates, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Brand update failed: ${error.message}`);
    const brand = await getBrandById(id);
    if (!brand) throw new Error('Brand not found');
    return brand;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const idx = localStore.brands.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Brand not found');
  localStore.brands[idx] = {
    ...localStore.brands[idx],
    ...updates,
    updated_at: now,
  };
  return {
    ...localStore.brands[idx],
    product_count: localStore.products.filter((p) => p.brand_id === id).length,
  };
}

export async function deleteBrand(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', id);

    if (countError && isStrictProduction()) {
      throw new Error(`Failed to verify products referencing brand: ${countError.message}`);
    }

    if (!countError && typeof count === 'number' && count > 0) {
      return {
        success: false,
        error: `Cannot delete brand: ${count} product(s) are currently assigned to this brand. Please reassign or delete them first, or deactivate the brand.`,
      };
    }

    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const productsUsingBrand = localStore.products.filter((p) => p.brand_id === id);
  if (productsUsingBrand.length > 0) {
    return {
      success: false,
      error: `Cannot delete brand: ${productsUsingBrand.length} product(s) are currently assigned to this brand. Please reassign or delete them first, or deactivate the brand.`,
    };
  }

  localStore.brands = localStore.brands.filter((b) => b.id !== id);
  return { success: true };
}

export async function getPackagingTypes(includeInactive = false): Promise<PackagingType[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase.from('packaging_types').select('*, products(id)').order('display_order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch packaging types: ${error.message}`);
    }
    if (!error && data) {
      return (data as Array<PackagingType & { products?: { id: string }[] }>).map((pt) => ({
        ...pt,
        product_count: pt.products?.length || 0,
      }));
    }
  }

  let list = localStore.packagingTypes;
  if (!includeInactive) {
    list = list.filter((p) => p.is_active);
  }
  return [...list]
    .map((pt) => ({
      ...pt,
      product_count: localStore.products.filter((p) => p.packaging_type_id === pt.id).length,
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

export async function getPackagingTypeById(id: string): Promise<PackagingType | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('packaging_types').select('*, products(id)').eq('id', id).single();
    if (error && error.code !== 'PGRST116' && isStrictProduction()) {
      throw new Error(`Failed to fetch packaging type: ${error.message}`);
    }
    if (!error && data) {
      const pt = data as PackagingType & { products?: { id: string }[] };
      return { ...pt, product_count: pt.products?.length || 0 };
    }
    return null;
  }
  const found = localStore.packagingTypes.find((p) => p.id === id);
  if (!found) return null;
  return {
    ...found,
    product_count: localStore.products.filter((p) => p.packaging_type_id === found.id).length,
  };
}

export type PackagingTypeInput = {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  is_default?: boolean;
};

export async function createPackagingType(data: PackagingTypeInput): Promise<PackagingType> {
  const supabase = await createServerSupabaseClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newPkg: PackagingType = {
    ...data,
    id,
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    display_order: data.display_order ?? 0,
    is_active: data.is_active ?? true,
    is_default: data.is_default ?? false,
    product_count: 0,
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    const { error } = await supabase.from('packaging_types').insert({
      id: newPkg.id,
      name: newPkg.name,
      slug: newPkg.slug,
      description: newPkg.description,
      image_url: newPkg.image_url,
      display_order: newPkg.display_order,
      is_active: newPkg.is_active,
      is_default: newPkg.is_default,
    });
    if (error) throw new Error(`Packaging type creation failed: ${error.message}`);
    return newPkg;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.packagingTypes.push(newPkg);
  return newPkg;
}

export async function updatePackagingType(id: string, updates: Partial<PackagingType>): Promise<PackagingType> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from('packaging_types')
      .update({ ...updates, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Packaging type update failed: ${error.message}`);
    const pt = await getPackagingTypeById(id);
    if (!pt) throw new Error('Packaging type not found');
    return pt;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const idx = localStore.packagingTypes.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Packaging type not found');
  localStore.packagingTypes[idx] = {
    ...localStore.packagingTypes[idx],
    ...updates,
    updated_at: now,
  };
  return {
    ...localStore.packagingTypes[idx],
    product_count: localStore.products.filter((p) => p.packaging_type_id === id).length,
  };
}

export async function deletePackagingType(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('packaging_type_id', id);

    if (countError && isStrictProduction()) {
      throw new Error(`Failed to check products referencing packaging type: ${countError.message}`);
    }

    if (!countError && typeof count === 'number' && count > 0) {
      return {
        success: false,
        error: `Cannot delete packaging type: ${count} product(s) are currently configured with this packaging type. Please reassign or update them first.`,
      };
    }

    const { error } = await supabase.from('packaging_types').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const productsUsingPkg = localStore.products.filter((p) => p.packaging_type_id === id);
  if (productsUsingPkg.length > 0) {
    return {
      success: false,
      error: `Cannot delete packaging type: ${productsUsingPkg.length} product(s) are currently configured with this packaging type. Please reassign or update them first.`,
    };
  }

  localStore.packagingTypes = localStore.packagingTypes.filter((p) => p.id !== id);
  return { success: true };
}

export interface GetProductsParams {
  categorySlug?: string | null;
  brandSlug?: string | null;
  searchQuery?: string | null;
  status?: PublicationStatus | 'all';
  featuredOnly?: boolean;
  sortBy?: 'newest' | 'name_asc' | 'name_desc' | 'moq_asc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getProducts({
  categorySlug,
  brandSlug,
  searchQuery,
  status = 'published',
  featuredOnly = false,
  sortBy = 'newest',
  page = 1,
  limit = 12,
}: GetProductsParams): Promise<ProductsResponse> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*),
        variants:product_variants(*),
        packaging_type:packaging_types(*)
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    if (categorySlug) {
      // Find category id
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    if (brandSlug) {
      const { data: br } = await supabase.from('brands').select('id').eq('slug', brandSlug).single();
      if (br) {
        query = query.eq('brand_id', br.id);
      }
    }

    if (searchQuery && searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(`name.ilike.${term},sku.ilike.${term},short_description.ilike.${term}`);
    }

    // Sorting
    switch (sortBy) {
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'moq_asc':
        query = query.order('moq', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    if (!error && data) {
      return {
        products: data as unknown as Product[],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }
  }

  // Fallback to localStore
  let list = [...localStore.products];

  // Status check - CRITICAL: draft & archived products must NEVER be shown if status is published
  if (status !== 'all') {
    list = list.filter((p) => p.status === status);
  }

  if (featuredOnly) {
    list = list.filter((p) => p.is_featured);
  }

  if (categorySlug) {
    const cat = localStore.categories.find((c) => c.slug === categorySlug);
    if (cat) {
      list = list.filter((p) => p.category_id === cat.id);
    } else {
      list = [];
    }
  }

  if (brandSlug) {
    const br = localStore.brands.find((b) => b.slug === brandSlug);
    if (br) {
      list = list.filter((p) => p.brand_id === br.id);
    } else {
      list = [];
    }
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.short_description && p.short_description.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (sortBy) {
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'moq_asc':
      list.sort((a, b) => a.moq - b.moq);
      break;
    case 'newest':
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }

  const total = list.length;
  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit).map((p) => ({
    ...p,
    category: localStore.categories.find((c) => c.id === p.category_id) || null,
    brand: localStore.brands.find((b) => b.id === p.brand_id) || null,
    packaging_type: localStore.packagingTypes.find((pt) => pt.id === p.packaging_type_id) || null,
    variants: p.variants || [],
  }));

  return {
    products: paginated,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductBySlug(slug: string, includeUnpublished = false): Promise<Product | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*),
        variants:product_variants(*),
        packaging_type:packaging_types(*)
      `)
      .eq('slug', slug);

    if (!includeUnpublished) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116' && isStrictProduction()) {
      throw new Error(`Failed to fetch product by slug: ${error.message}`);
    }
    if (!error && data) {
      return data as unknown as Product;
    }
    return null;
  }

  const p = localStore.products.find((prod) => prod.slug === slug);
  if (!p) return null;
  if (!includeUnpublished && p.status !== 'published') {
    return null; // Don't expose unpublished product!
  }

  return {
    ...p,
    category: localStore.categories.find((c) => c.id === p.category_id) || null,
    brand: localStore.brands.find((b) => b.id === p.brand_id) || null,
    packaging_type: localStore.packagingTypes.find((pt) => pt.id === p.packaging_type_id) || null,
    variants: p.variants || [],
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        brand:brands(*),
        images:product_images(*),
        variants:product_variants(*),
        packaging_type:packaging_types(*)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116' && isStrictProduction()) {
      throw new Error(`Failed to fetch product by ID: ${error.message}`);
    }
    if (!error && data) {
      return data as unknown as Product;
    }
    return null;
  }

  const p = localStore.products.find((prod) => prod.id === id);
  if (!p) return null;
  return {
    ...p,
    category: localStore.categories.find((c) => c.id === p.category_id) || null,
    brand: localStore.brands.find((b) => b.id === p.brand_id) || null,
    packaging_type: localStore.packagingTypes.find((pt) => pt.id === p.packaging_type_id) || null,
    variants: p.variants || [],
  };
}

export type ProductInput = Omit<Partial<Product>, 'images' | 'variants'> & {
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
};

export async function createProduct(productData: ProductInput): Promise<Product> {
  const supabase = await createServerSupabaseClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const variants: ProductVariant[] = (productData.variants || []).map((v, idx) => ({
    id: v.id || crypto.randomUUID(),
    product_id: id,
    colour_name: v.colour_name || 'Standard',
    colour_family: v.colour_family || null,
    hex_code: v.hex_code || null,
    pattern: v.pattern || null,
    variant_sku: v.variant_sku || null,
    display_order: v.display_order ?? idx,
    is_active: v.is_active ?? true,
    created_at: now,
    updated_at: now,
  }));

  const images: ProductImage[] = (productData.images || []).map((img, idx) => ({
    id: img.id || crypto.randomUUID(),
    product_id: id,
    variant_id: img.variant_id || null,
    image_url: img.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    alt_text: img.alt_text || productData.name || 'Product Image',
    display_order: img.display_order ?? idx,
    is_primary: img.is_primary ?? idx === 0,
    created_at: now,
  }));

  const newProduct: Product = {
    id,
    name: productData.name || 'New Product',
    slug: productData.slug || `prod-${Date.now()}`,
    sku: productData.sku || null,
    category_id: productData.category_id || null,
    brand_id: productData.brand_id || null,
    short_description: productData.short_description || null,
    description: productData.description || null,
    material: productData.material || null,
    available_sizes: productData.available_sizes || [],
    color: productData.color || null,
    wholesale_price: productData.wholesale_price ?? null,
    price_visibility: productData.price_visibility || 'contact',
    moq: productData.moq || 12,
    availability_status: productData.availability_status || 'in_stock',
    is_featured: productData.is_featured || false,
    status: productData.status || 'draft',
    packaging_type_id: productData.packaging_type_id || null,
    packaging_units_per_package: productData.packaging_units_per_package ?? 1,
    packaging_pairs_per_carton: productData.packaging_pairs_per_carton ?? null,
    carton_dimensions: productData.carton_dimensions || null,
    carton_weight: productData.carton_weight || null,
    carton_size_assortment: productData.carton_size_assortment || null,
    packaging_included_in_price: productData.packaging_included_in_price ?? true,
    packaging_notes: productData.packaging_notes || null,
    seo_title: productData.seo_title || null,
    seo_description: productData.seo_description || null,
    images,
    variants,
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    const { error } = await supabase.from('products').insert({
      id: newProduct.id,
      name: newProduct.name,
      slug: newProduct.slug,
      sku: newProduct.sku,
      category_id: newProduct.category_id,
      brand_id: newProduct.brand_id,
      short_description: newProduct.short_description,
      description: newProduct.description,
      material: newProduct.material,
      available_sizes: newProduct.available_sizes,
      color: newProduct.color,
      wholesale_price: newProduct.wholesale_price,
      price_visibility: newProduct.price_visibility,
      moq: newProduct.moq,
      availability_status: newProduct.availability_status,
      is_featured: newProduct.is_featured,
      status: newProduct.status,
      packaging_type_id: newProduct.packaging_type_id,
      packaging_units_per_package: newProduct.packaging_units_per_package,
      packaging_pairs_per_carton: newProduct.packaging_pairs_per_carton,
      carton_dimensions: newProduct.carton_dimensions,
      carton_weight: newProduct.carton_weight,
      carton_size_assortment: newProduct.carton_size_assortment,
      packaging_included_in_price: newProduct.packaging_included_in_price,
      packaging_notes: newProduct.packaging_notes,
      seo_title: newProduct.seo_title,
      seo_description: newProduct.seo_description,
    });
    if (error) {
      throw new Error(`Failed to create product in Supabase: ${error.message}`);
    }

    if (variants.length > 0) {
      await supabase.from('product_variants').insert(variants);
    }

    if (images.length > 0) {
      await supabase.from('product_images').insert(images);
    }
    return newProduct;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.products.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: ProductInput): Promise<Product> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { images, variants, category, brand, packaging_type, ...productFields } = updates;
    const { error } = await supabase
      .from('products')
      .update({ ...productFields, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id);
      if (variants.length > 0) {
        await supabase.from('product_variants').insert(
          variants.map((v, idx) => ({
            id: v.id || crypto.randomUUID(),
            product_id: id,
            colour_name: v.colour_name || 'Standard',
            colour_family: v.colour_family || null,
            hex_code: v.hex_code || null,
            pattern: v.pattern || null,
            variant_sku: v.variant_sku || null,
            display_order: v.display_order ?? idx,
            is_active: v.is_active ?? true,
            created_at: now,
            updated_at: now,
          }))
        );
      }
    }

    if (images !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        await supabase.from('product_images').insert(
          images.map((img, idx) => ({
            id: img.id || crypto.randomUUID(),
            product_id: id,
            variant_id: img.variant_id || null,
            image_url: img.image_url!,
            alt_text: img.alt_text || '',
            display_order: img.display_order ?? idx,
            is_primary: img.is_primary ?? idx === 0,
            created_at: now,
          }))
        );
      }
    }

    const updated = await getProductById(id);
    if (!updated) throw new Error('Product not found after update');
    return updated;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const idx = localStore.products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Product not found');

  const existing = localStore.products[idx];

  const updatedVariants: ProductVariant[] = updates.variants !== undefined
    ? updates.variants.map((v, i) => ({
        id: v.id || crypto.randomUUID(),
        product_id: id,
        colour_name: v.colour_name || 'Standard',
        colour_family: v.colour_family || null,
        hex_code: v.hex_code || null,
        pattern: v.pattern || null,
        variant_sku: v.variant_sku || null,
        display_order: v.display_order ?? i,
        is_active: v.is_active ?? true,
        created_at: v.created_at || now,
        updated_at: now,
      }))
    : existing.variants || [];

  const updatedImages: ProductImage[] = updates.images !== undefined
    ? updates.images.map((img, i) => ({
        id: img.id || crypto.randomUUID(),
        product_id: id,
        variant_id: img.variant_id || null,
        image_url: img.image_url || existing.images[0]?.image_url || '',
        alt_text: img.alt_text || '',
        display_order: img.display_order ?? i,
        is_primary: img.is_primary ?? i === 0,
        created_at: now,
      }))
    : existing.images;

  const { category, brand, packaging_type, ...cleanUpdates } = updates;

  const updated: Product = {
    ...existing,
    ...cleanUpdates,
    images: updatedImages,
    variants: updatedVariants,
    updated_at: now,
  };

  localStore.products[idx] = updated;
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete product: ${error.message}`);
    return true;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const initialLen = localStore.products.length;
  localStore.products = localStore.products.filter((p) => p.id !== id);
  return localStore.products.length < initialLen;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const original = await getProductById(id);
  if (!original) throw new Error('Source product not found for duplication');

  const timestamp = Date.now();
  const duplicatedData: ProductInput = {
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${timestamp}`,
    sku: original.sku ? `${original.sku}-COPY` : null,
    category_id: original.category_id,
    brand_id: original.brand_id,
    short_description: original.short_description,
    description: original.description,
    material: original.material,
    available_sizes: [...(original.available_sizes || [])],
    color: original.color,
    wholesale_price: original.wholesale_price,
    price_visibility: original.price_visibility,
    moq: original.moq,
    availability_status: original.availability_status,
    is_featured: false,
    status: 'draft',
    packaging_type_id: original.packaging_type_id,
    packaging_units_per_package: original.packaging_units_per_package,
    packaging_pairs_per_carton: original.packaging_pairs_per_carton,
    carton_dimensions: original.carton_dimensions,
    carton_weight: original.carton_weight,
    carton_size_assortment: original.carton_size_assortment,
    packaging_included_in_price: original.packaging_included_in_price,
    packaging_notes: original.packaging_notes,
    seo_title: original.seo_title,
    seo_description: original.seo_description,
    images: (original.images || []).map((img) => ({
      image_url: img.image_url,
      alt_text: img.alt_text,
      display_order: img.display_order,
      is_primary: img.is_primary,
      variant_id: img.variant_id,
    })),
    variants: (original.variants || []).map((v) => ({
      colour_name: v.colour_name,
      colour_family: v.colour_family,
      hex_code: v.hex_code,
      pattern: v.pattern,
      variant_sku: v.variant_sku ? `${v.variant_sku}-COPY` : null,
      display_order: v.display_order,
      is_active: v.is_active,
    })),
  };

  return createProduct(duplicatedData);
}

export async function bulkUpdateProductStatus(
  ids: string[],
  status: PublicationStatus
): Promise<{ updatedCount: number }> {
  if (ids.length === 0) return { updatedCount: 0 };
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error, count } = await supabase
      .from('products')
      .update({ status, updated_at: now })
      .in('id', ids);
    if (error) throw new Error(`Bulk status update failed: ${error.message}`);
    return { updatedCount: count ?? ids.length };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  let updated = 0;
  localStore.products.forEach((p) => {
    if (ids.includes(p.id)) {
      p.status = status;
      p.updated_at = now;
      updated++;
    }
  });
  return { updatedCount: updated };
}

export async function bulkAssignCategory(
  ids: string[],
  categoryId: string | null
): Promise<{ updatedCount: number }> {
  if (ids.length === 0) return { updatedCount: 0 };
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error, count } = await supabase
      .from('products')
      .update({ category_id: categoryId, updated_at: now })
      .in('id', ids);
    if (error) throw new Error(`Bulk category assignment failed: ${error.message}`);
    return { updatedCount: count ?? ids.length };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  let updated = 0;
  localStore.products.forEach((p) => {
    if (ids.includes(p.id)) {
      p.category_id = categoryId;
      p.updated_at = now;
      updated++;
    }
  });
  return { updatedCount: updated };
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ deletedCount: number }> {
  if (ids.length === 0) return { deletedCount: 0 };
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const { error, count } = await supabase
      .from('products')
      .delete()
      .in('id', ids);
    if (error) throw new Error(`Bulk delete failed: ${error.message}`);
    return { deletedCount: count ?? ids.length };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const before = localStore.products.length;
  localStore.products = localStore.products.filter((p) => !ids.includes(p.id));
  return { deletedCount: before - localStore.products.length };
}

export { computeProductCompleteness, type ProductCompleteness } from './completeness';

export async function createCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newCat: Category = {
    ...cat,
    id,
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    const { error } = await supabase.from('categories').insert(newCat);
    if (error) throw new Error(`Category creation failed: ${error.message}`);
    return newCat;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.categories.push(newCat);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Category update failed: ${error.message}`);
    const cats = await getCategories(true);
    const updated = cats.find((c) => c.id === id);
    if (!updated) throw new Error('Category not found');
    return updated;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const idx = localStore.categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Category not found');
  localStore.categories[idx] = {
    ...localStore.categories[idx],
    ...updates,
    updated_at: now,
  };
  return localStore.categories[idx];
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    // Check product count using supabase to prevent deleting a category with attached products
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError && isStrictProduction()) {
      throw new Error(`Failed to verify products referencing category: ${countError.message}`);
    }

    if (!countError && typeof count === 'number' && count > 0) {
      return {
        success: false,
        error: `Cannot delete category: ${count} product(s) are currently assigned to this category. Reassign or delete them first.`,
      };
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  // Fallback check against in-memory store
  const productsUsingCat = localStore.products.filter((p) => p.category_id === id);
  if (productsUsingCat.length > 0) {
    return {
      success: false,
      error: `Cannot delete category: ${productsUsingCat.length} product(s) are currently assigned to this category. Reassign or delete them first.`,
    };
  }

  localStore.categories = localStore.categories.filter((c) => c.id !== id);
  return { success: true };
}

export async function submitEnquiry(
  enquiry: Omit<Enquiry, 'id' | 'status' | 'created_at' | 'updated_at' | 'follow_up_date'> & {
    follow_up_date?: string | null;
  }
): Promise<Enquiry> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const newEnquiry: Enquiry = {
    ...enquiry,
    id,
    status: 'new',
    follow_up_date: enquiry.follow_up_date || null,
    notes: [],
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    const { error } = await supabase.from('enquiries').insert({
      id: newEnquiry.id,
      name: newEnquiry.name,
      shop_name: newEnquiry.shop_name,
      phone: newEnquiry.phone,
      email: newEnquiry.email,
      city: newEnquiry.city,
      enquiry_type: newEnquiry.enquiry_type,
      product_id: newEnquiry.product_id,
      product_name: newEnquiry.product_name,
      sku: newEnquiry.sku,
      message: newEnquiry.message,
      status: newEnquiry.status,
    });
    if (error) {
      throw new Error(`Enquiry submission failed: ${error.message}`);
    }
    return newEnquiry;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.enquiries.unshift(newEnquiry);
  return newEnquiry;
}

export async function getEnquiries({
  status,
  search,
}: { status?: EnquiryStatus | 'all'; search?: string } = {}): Promise<Enquiry[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    let query = supabase.from('enquiries').select('*, notes:enquiry_notes(*)').order('created_at', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},shop_name.ilike.${term},phone.ilike.${term},city.ilike.${term}`);
    }
    const { data, error } = await query;
    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch enquiries: ${error.message}`);
    }
    if (!error && data) {
      return data as Enquiry[];
    }
  }

  let list = [...localStore.enquiries];
  if (status && status !== 'all') {
    list = list.filter((e) => e.status === status);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.shop_name && e.shop_name.toLowerCase().includes(q)) ||
        e.phone.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  followUpDate?: string | null
): Promise<Enquiry> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const updatePayload: Record<string, unknown> = { status, updated_at: now };
    if (followUpDate !== undefined) {
      updatePayload.follow_up_date = followUpDate;
    }
    const { data, error } = await supabase
      .from('enquiries')
      .update(updatePayload)
      .eq('id', id)
      .select('*, notes:enquiry_notes(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as Enquiry;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const enq = localStore.enquiries.find((e) => e.id === id);
  if (!enq) throw new Error('Enquiry not found');
  enq.status = status;
  if (followUpDate !== undefined) {
    enq.follow_up_date = followUpDate;
  }
  enq.updated_at = now;
  return enq;
}

export async function addEnquiryNote(enquiryId: string, noteText: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const noteId = crypto.randomUUID();

  if (supabase) {
    const { error } = await supabase.from('enquiry_notes').insert({
      id: noteId,
      enquiry_id: enquiryId,
      note: noteText,
      created_at: now,
    });
    if (error) throw new Error(error.message);
    return;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const enq = localStore.enquiries.find((e) => e.id === enquiryId);
  if (enq) {
    if (!enq.notes) enq.notes = [];
    enq.notes.unshift({
      id: noteId,
      enquiry_id: enquiryId,
      author_id: null,
      author_name: 'Admin',
      note: noteText,
      created_at: now,
    });
  }
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  const len = localStore.enquiries.length;
  localStore.enquiries = localStore.enquiries.filter((e) => e.id !== id);
  return localStore.enquiries.length < len;
}

export async function getDashboardMetrics() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const [pubRes, draftRes, catRes, enqRes, recentRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      publishedProducts: pubRes.count || 0,
      draftProducts: draftRes.count || 0,
      totalCategories: catRes.count || 0,
      totalEnquiries: enqRes.count || 0,
      recentEnquiries: recentRes.data || [],
    };
  }

  return {
    publishedProducts: localStore.products.filter((p) => p.status === 'published').length,
    draftProducts: localStore.products.filter((p) => p.status === 'draft').length,
    totalCategories: localStore.categories.length,
    totalEnquiries: localStore.enquiries.length,
    recentEnquiries: localStore.enquiries.slice(0, 5),
  };
}
