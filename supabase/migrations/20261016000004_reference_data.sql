-- Wholesale Footwear Reference Data Migration
-- Sets up default business settings record and foundational footwear categories

-- 1. Default Business Settings Record
insert into public.business_settings (
  id,
  business_name,
  tagline,
  phone,
  whatsapp_number,
  email,
  address,
  city,
  state,
  pincode,
  business_hours,
  service_areas,
  hero_headline,
  hero_subheadline,
  about_intro,
  about_history,
  about_strengths,
  wholesale_terms,
  moq_policy,
  shipping_info,
  return_policy
) values (
  'default',
  'Wholesale Footwear Business',
  'Premium Wholesale Footwear Partner for Retailers Across India',
  '+91 00000 00000',
  '910000000000',
  'contact@wholesalefootwear.example.com',
  'Commercial Footwear Hub',
  'Agra',
  'Uttar Pradesh',
  '282001',
  'Monday to Saturday: 10:00 AM – 8:00 PM',
  array['Pan-India Transport', 'Delhi NCR', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh', 'Punjab & Haryana'],
  'Direct Wholesale Supply for Footwear Retailers',
  'Explore curated bulk footwear collections for men, women, and kids with transparent wholesale terms and dependable dispatch across India.',
  'Supplying verified retail businesses and independent shoe stores with durable, fast-moving footwear designs in standard carton packaging.',
  'Partnering with regional footwear retailers, distributors, and department stores, offering transparent bulk rates and reliable transport booking.',
  '[
    {"title": "Standard Carton Assortments", "description": "Preset size ratios optimized for retail velocity (sizes 6-10 or 7-11 per carton)."},
    {"title": "Direct B2B Pricing", "description": "Volume-tiered wholesale rates tailored for independent retailers and bulk stockists."},
    {"title": "Transport Hub Dispatch", "description": "Daily bilty booking and tie-ups with leading road logistics across all major transport hubs."},
    {"title": "Transparent Verification", "description": "Prompt WhatsApp confirmation of current lot availability, colors, and pack sizes before booking."}
  ]'::jsonb,
  'Orders are accepted in standard carton lots. Prices quoted are ex-warehouse unless specified otherwise in transport bilty. GST is applicable extra as per statutory slabs.',
  'Standard Minimum Order Quantity (MOQ) is 1 carton (typically 12 to 24 pairs depending on product series). Mix-size assortments follow industry standard size curves.',
  'Goods are dispatched through verified transport agencies across India. Freight charges (to-pay / paid) are billed on the lorry receipt / bilty based on carton count and weight.',
  'Inspect cartons at the time of transport delivery. In the rare event of transit damage or manufacturing defect, report with carton photos within 48 hours of transport delivery for prompt credit note or replacement adjustment.'
) on conflict (id) do nothing;

-- 2. Standard Footwear Categories
insert into public.categories (id, name, slug, description, display_order, is_active) values
  ('c1111111-1111-1111-1111-111111111111', 'Men''s Formal & Office', 'mens-formal', 'Classic leatherette, Derby, and Oxford wholesale lots for office and formal retail.', 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'Men''s Sports & Sneaker', 'mens-sports', 'Breathable mesh trainers, running shoes, and lifestyle sneakers in bulk cartons.', 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'Men''s Casual & Loafers', 'mens-casual', 'Comfort slip-on loafers, driving shoes, and daily casual footwear.', 3, true),
  ('c4444444-4444-4444-4444-444444444444', 'Women''s Flat & Ethnic', 'womens-flats', 'Daily wear flat sandals, Kolhapuris, and ethnic slip-ons for women.', 4, true),
  ('c5555555-5555-5555-5555-555555555555', 'Kids & School Shoes', 'kids-school', 'Durable PVC and rubber sole school shoes, velcro sneakers, and youth footwear.', 5, true),
  ('c6666666-6666-6666-6666-666666666666', 'Slippers & Slides', 'slippers-slides', 'High-density EVA foam slippers, daily sliders, and indoor footwear cartons.', 6, true)
on conflict (slug) do nothing;
