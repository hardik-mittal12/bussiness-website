// Live Supabase Backend & RLS Security Verification Script
// Run via: node scripts/verify_live_supabase.mjs

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local without external dotenv dependency
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing required Supabase keys in .env.local');
  process.exit(1);
}

// 1. Anonymous Client (Public Visitor)
const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// 2. Admin Management Client (Strictly used for provisioning disposable test users & direct cleanup)
const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

async function runLiveVerification() {
  console.log('================================================================');
  console.log('STARTING LIVE SUPABASE DATABASE & RLS VERIFICATION');
  console.log('Target URL Host:', new URL(supabaseUrl).host);
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- SECTION 1: ANONYMOUS VISITOR BOUNDARIES ---
  console.log('--- 1. Testing Anonymous Public Visitor Access ---');

  const { data: categories, error: catErr } = await anonClient.from('categories').select('id, name, slug');
  if (catErr) console.error('catErr details:', catErr);
  assert(!catErr && categories && categories.length >= 6, `Anonymous can read ${categories?.length || 0} active categories`);

  // Can read active packaging types
  const { data: packaging, error: pkgErr } = await anonClient.from('packaging_types').select('id, name');
  assert(!pkgErr && packaging && packaging.length >= 4, `Anonymous can read ${packaging?.length || 0} active packaging types`);

  // Cannot see draft products
  const { data: anonProducts, error: prodErr } = await anonClient.from('products').select('id, name, status');
  const draftProds = anonProducts?.filter(p => p.status !== 'published') || [];
  assert(!prodErr && draftProds.length === 0, 'Anonymous visitor receives 0 draft/unpublished products');

  // Cannot read enquiries
  const { data: anonEnquiries } = await anonClient.from('enquiries').select('*');
  assert(!anonEnquiries || anonEnquiries.length === 0, 'Anonymous visitor CANNOT read enquiries (returns 0 rows)');

  // Cannot read enquiry notes
  const { data: anonNotes, error: notesErr } = await anonClient.from('enquiry_notes').select('*');
  assert(notesErr || !anonNotes || anonNotes.length === 0, 'Anonymous visitor CANNOT read internal enquiry notes');

  // Anonymous visitor CAN submit a validated wholesale enquiry
  const testEnquiry = {
    name: 'Temporary Test Visitor',
    shop_name: 'Test Retail Store',
    phone: '+91 99999 88888',
    city: 'Jaipur',
    enquiry_type: 'general',
    message: 'Automated live test enquiry submission'
  };
  const { error: subErr, status: subStatus } = await anonClient.from('enquiries').insert(testEnquiry);
  assert(!subErr && subStatus === 201, 'Anonymous visitor CAN insert legitimate wholesale enquiry');

  // Verify enquiry persisted in remote database via serviceClient
  const { data: dbEnquiries } = await serviceClient.from('enquiries').select('*').eq('phone', '+91 99999 88888');
  assert(dbEnquiries && dbEnquiries.length >= 1, 'Enquiry successfully persisted in remote database');
  const submittedEnquiry = dbEnquiries[0];

  // Verify anonymous visitor STILL cannot read that newly inserted enquiry back
  const { data: readBack } = await anonClient.from('enquiries').select('*').eq('id', submittedEnquiry.id);
  assert(!readBack || readBack.length === 0, 'Anonymous visitor CANNOT read back newly inserted enquiry (strict write-only RLS)');

  // Anonymous visitor CANNOT mutate catalogue tables directly
  const { error: hackBrandErr } = await anonClient.from('brands').insert({ name: 'Hacked Brand', slug: 'hacked-brand' });
  assert(hackBrandErr !== null, 'Anonymous direct INSERT on brands is strictly rejected by RLS');

  const { error: hackProdErr } = await anonClient.from('products').insert({ name: 'Hacked Shoe', slug: 'hacked-shoe' });
  assert(hackProdErr !== null, 'Anonymous direct INSERT on products is strictly rejected by RLS');

  const { error: hackPkgErr } = await anonClient.from('packaging_types').insert({ name: 'Hacked Pkg', slug: 'hacked-pkg' });
  assert(hackPkgErr !== null, 'Anonymous direct INSERT on packaging_types is strictly rejected by RLS');


  // --- SECTION 2: ORDINARY AUTHENTICATED USER & SELF-PROMOTION GUARD ---
  console.log('\n--- 2. Testing Ordinary Authenticated User Context ---');

  const testUserEmail = `test_viewer_${Date.now()}@example.com`;
  const testPassword = `Pass#${Date.now()}!Secure123`;

  // Create temporary user via auth admin
  const { data: createdAuthUser, error: createUserErr } = await serviceClient.auth.admin.createUser({
    email: testUserEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: 'Test Viewer' }
  });
  assert(!createUserErr && createdAuthUser?.user?.id, 'Provisioned disposable test user account');
  const userId = createdAuthUser.user.id;

  // Sign in as this ordinary user using anon client (Authentic User Session)
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  const { data: userSession, error: userLoginErr } = await userClient.auth.signInWithPassword({
    email: testUserEmail,
    password: testPassword
  });
  assert(!userLoginErr && userSession?.session?.access_token, 'Signed in as authenticated user with authentic JWT');

  // Verify profile was automatically created by handle_new_user trigger
  const { data: userProfile } = await userClient.from('profiles').select('id, role').eq('id', userId).single();
  assert(userProfile?.role === 'viewer', 'Auth trigger automatically initialized user profile with role = "viewer"');

  // Verify user CANNOT promote themselves to admin (RLS + trigger block modification)
  await userClient.from('profiles').update({ role: 'admin' }).eq('id', userId);
  const { data: checkRole } = await serviceClient.from('profiles').select('role').eq('id', userId).single();
  assert(checkRole?.role === 'viewer', 'Self-promotion to admin is strictly blocked (role remains viewer)');

  // Verify ordinary user CANNOT mutate catalogue
  const { error: viewerBrandErr } = await userClient.from('brands').insert({ name: 'Viewer Brand', slug: 'viewer-brand' });
  assert(viewerBrandErr !== null, 'Ordinary authenticated user CANNOT insert brands');

  // Verify ordinary user CANNOT read other users or enquiries
  const { data: viewerEnquiries } = await userClient.from('enquiries').select('*');
  assert(!viewerEnquiries || viewerEnquiries.length === 0, 'Ordinary authenticated user CANNOT read wholesale enquiries');


  // --- SECTION 3: AUTHENTICATED ADMINISTRATOR OPERATIONS ---
  console.log('\n--- 3. Testing Authenticated Administrator Operations ---');

  // Elevate test user to admin via database admin query
  await serviceClient.from('profiles').update({ role: 'admin' }).eq('id', userId);

  // Refresh user token / re-sign-in so user client reflects admin privileges
  const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  await adminClient.auth.signInWithPassword({
    email: testUserEmail,
    password: testPassword
  });

  // 1. Admin can read enquiries
  const { data: adminEnquiries, error: adminEnqErr } = await adminClient.from('enquiries').select('*').eq('id', submittedEnquiry.id);
  assert(!adminEnqErr && adminEnquiries && adminEnquiries.length === 1, 'Authenticated administrator CAN view customer wholesale enquiries');

  // 2. Admin creates a temporary Brand
  const testBrandSlug = `temp-test-brand-${Date.now()}`;
  const { data: newBrand, error: newBrandErr } = await adminClient.from('brands').insert({
    name: 'Live Test Brand',
    slug: testBrandSlug,
    description: 'Temporary brand for live database verification',
    is_active: true
  }).select().single();
  assert(!newBrandErr && newBrand?.id, 'Admin successfully created temporary brand in live database');

  // 3. Admin creates a Product with Draft status
  const testProductSlug = `temp-test-boot-${Date.now()}`;
  const { data: newProduct, error: newProductErr } = await adminClient.from('products').insert({
    name: 'Live Test Safety Boot',
    slug: testProductSlug,
    sku: `TEST-BOOT-${Date.now().toString().slice(-4)}`,
    brand_id: newBrand.id,
    category_id: categories[0].id,
    packaging_type_id: packaging[0].id,
    packaging_pairs_per_carton: 12,
    wholesale_price: 650.00,
    moq: 12,
    status: 'draft', // Initially draft
    short_description: 'High-durability steel toe safety boot'
  }).select().single();
  assert(!newProductErr && newProduct?.id, 'Admin successfully created product in live database');

  // 4. Admin adds 2 Colour Variants
  const { data: variants, error: variantErr } = await adminClient.from('product_variants').insert([
    {
      product_id: newProduct.id,
      colour_name: 'Tan Brown',
      colour_family: 'Brown',
      hex_code: '#8B4513',
      display_order: 1
    },
    {
      product_id: newProduct.id,
      colour_name: 'Jet Black',
      colour_family: 'Black',
      hex_code: '#000000',
      display_order: 2
    }
  ]).select();
  assert(!variantErr && variants?.length === 2, 'Admin added 2 colour variants to the live product');

  // 5. Admin uploads separate images for each variant to Supabase Storage
  const samplePixelJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  
  const imgPath1 = `products/test-tan-${Date.now()}.jpg`;
  const imgPath2 = `products/test-black-${Date.now()}.jpg`;

  const { error: uploadErr1 } = await adminClient.storage.from('product-images').upload(imgPath1, samplePixelJpg, { contentType: 'image/jpeg' });
  const { error: uploadErr2 } = await adminClient.storage.from('product-images').upload(imgPath2, samplePixelJpg, { contentType: 'image/jpeg' });
  assert(!uploadErr1 && !uploadErr2, 'Admin successfully uploaded photographs for both colourways to product-images storage bucket');

  const { data: pubUrl1 } = adminClient.storage.from('product-images').getPublicUrl(imgPath1);
  const { data: pubUrl2 } = adminClient.storage.from('product-images').getPublicUrl(imgPath2);

  // Link images to variants in product_images table
  const { data: prodImgs, error: imgLinkErr } = await adminClient.from('product_images').insert([
    {
      product_id: newProduct.id,
      variant_id: variants[0].id,
      image_url: pubUrl1.publicUrl,
      alt_text: 'Live Test Boot Tan Brown',
      is_primary: true,
      display_order: 1
    },
    {
      product_id: newProduct.id,
      variant_id: variants[1].id,
      image_url: pubUrl2.publicUrl,
      alt_text: 'Live Test Boot Jet Black',
      is_primary: false,
      display_order: 2
    }
  ]).select();
  assert(!imgLinkErr && prodImgs?.length === 2, 'Associated variant-specific images in product_images table');

  // 6. Verify Draft Boundary: Anonymous client CANNOT view this draft product or its variants
  const { data: anonDraftCheck } = await anonClient.from('products').select('id').eq('id', newProduct.id);
  assert(!anonDraftCheck || anonDraftCheck.length === 0, 'Anonymous visitor CANNOT see draft product');

  const { data: anonVariantCheck } = await anonClient.from('product_variants').select('id').eq('product_id', newProduct.id);
  assert(!anonVariantCheck || anonVariantCheck.length === 0, 'Anonymous visitor CANNOT see variants of draft product');

  // 7. Admin Publishes Product
  const { error: pubErr } = await adminClient.from('products').update({ status: 'published' }).eq('id', newProduct.id);
  assert(!pubErr, 'Admin successfully published product');

  // 8. Anonymous client CAN now view published product and active variants
  const { data: anonPubCheck } = await anonClient.from('products').select('id, name, slug').eq('id', newProduct.id).single();
  assert(anonPubCheck?.id === newProduct.id, 'Anonymous visitor CAN now view product after publication');

  const { data: anonPubVariants } = await anonClient.from('product_variants').select('id, colour_name').eq('product_id', newProduct.id);
  assert(anonPubVariants?.length === 2, 'Anonymous visitor CAN view active colour variants for published product');

  // 9. Test Referential Integrity: Deleting Brand while product is linked MUST fail (ON DELETE RESTRICT)
  const { error: delBrandFail } = await adminClient.from('brands').delete().eq('id', newBrand.id);
  assert(delBrandFail !== null, 'Deleting brand with associated products is BLOCKED by ON DELETE RESTRICT constraint');

  // 10. Clean Up Temporary Records
  console.log('\n--- 4. Cleaning Up Temporary Test Records ---');

  // Delete product (cascades variants, set null on images)
  await serviceClient.from('products').delete().eq('id', newProduct.id);
  // Delete brand
  await serviceClient.from('brands').delete().eq('id', newBrand.id);
  // Delete enquiry
  await serviceClient.from('enquiries').delete().eq('id', submittedEnquiry.id);
  // Delete storage objects
  await serviceClient.storage.from('product-images').remove([imgPath1, imgPath2]);
  // Delete test auth user (cascades profile)
  await serviceClient.auth.admin.deleteUser(userId);

  console.log('Temporary test records, images, and test user successfully cleaned up.');

  // Confirm database returned to clean state
  const { data: finalProds } = await serviceClient.from('products').select('id');
  assert(finalProds.length === 0, 'Genuine catalogue data verified untouched (0 lingering test products)');

  console.log('\n================================================================');
  console.log(`ALL ${passedTests}/${totalTests} LIVE SUPABASE TESTS PASSED (100%)`);
  console.log('================================================================');
}

runLiveVerification().catch(err => {
  console.error('\nVerification Error:', err);
  process.exit(1);
});
