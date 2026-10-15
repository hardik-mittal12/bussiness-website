import { 
  BusinessSettings, 
  Category, 
  Brand, 
  Product, 
  Enquiry, 
  EnquiryStatus, 
  PublicationStatus, 
  ProductImage 
} from './types';
import { 
  initialBusinessSettings, 
  initialCategories, 
  initialBrands, 
  initialProducts, 
  initialEnquiries 
} from './mock-data';
import { createServerSupabaseClient } from './supabase/server';

// In-memory store for fallback/local execution when Supabase credentials are not yet supplied
class LocalDataStore {
  businessSettings: BusinessSettings = { ...initialBusinessSettings };
  categories: Category[] = [...initialCategories];
  brands: Brand[] = [...initialBrands];
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

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error && isStrictProduction()) {
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }
    if (!error && data) {
      return data as Brand[];
    }
  }
  return [...localStore.brands].sort((a, b) => a.name.localeCompare(b.name));
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
        images:product_images(*)
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
        images:product_images(*)
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
        images:product_images(*)
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
  };
}

export async function createProduct(productData: Partial<Product> & { images?: Partial<ProductImage>[] }): Promise<Product> {
  const supabase = await createServerSupabaseClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

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
    seo_title: productData.seo_title || null,
    seo_description: productData.seo_description || null,
    images: (productData.images || []).map((img, idx) => ({
      id: img.id || crypto.randomUUID(),
      product_id: id,
      image_url: img.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      alt_text: img.alt_text || productData.name || 'Product Image',
      display_order: img.display_order ?? idx,
      is_primary: img.is_primary ?? idx === 0,
      created_at: now,
    })),
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
      seo_title: newProduct.seo_title,
      seo_description: newProduct.seo_description,
    });
    if (error) {
      throw new Error(`Failed to create product in Supabase: ${error.message}`);
    }

    if (newProduct.images.length > 0) {
      await supabase.from('product_images').insert(newProduct.images);
    }
    return newProduct;
  }

  if (isStrictProduction()) {
    throw new Error('Database write rejected: Persistent Supabase database connection is not configured or unavailable in production.');
  }

  localStore.products.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product> & { images?: Partial<ProductImage>[] }): Promise<Product> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { images, ...productFields } = updates;
    const { error } = await supabase
      .from('products')
      .update({ ...productFields, updated_at: now })
      .eq('id', id);
    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (images) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        await supabase.from('product_images').insert(
          images.map((img, idx) => ({
            id: img.id || crypto.randomUUID(),
            product_id: id,
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
  const updatedImages: ProductImage[] = updates.images
    ? updates.images.map((img, i) => ({
        id: img.id || crypto.randomUUID(),
        product_id: id,
        image_url: img.image_url || existing.images[0]?.image_url || '',
        alt_text: img.alt_text || '',
        display_order: img.display_order ?? i,
        is_primary: img.is_primary ?? i === 0,
        created_at: now,
      }))
    : existing.images;

  const updated: Product = {
    ...existing,
    ...updates,
    images: updatedImages,
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
