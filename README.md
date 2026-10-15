# Wholesale Footwear Business Platform & Secure Admin Dashboard

A modern, production-ready B2B wholesale footwear website and administrative operations platform. Designed specifically for wholesale distributors supplying independent shoe retailers, department stores, and bulk stockists across India.

---

## Table of Contents

1. [Architecture & Technology Stack](#1-architecture--technology-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Supabase Setup & Database Migrations](#4-supabase-setup--database-migrations)
5. [Storage Bucket Setup](#5-storage-bucket-setup)
6. [Administrator Account Provisioning](#6-administrator-account-provisioning)
7. [Local Development](#7-local-development)
8. [Automated Testing & Verification](#8-automated-testing--verification)
9. [Routine Operations Without Editing Code](#9-routine-operations-without-editing-code)
10. [Production Deployment (Vercel / Node)](#10-production-deployment-vercel--node)
11. [Custom Domain & DNS Setup](#11-custom-domain--dns-setup)
12. [HTTPS & Security Hardening](#12-https--security-hardening)
13. [SEO & Google Search Console Checklist](#13-seo--google-search-console-checklist)
14. [Backup & Recovery Recommendations](#14-backup--recovery-recommendations)

---

## 1. Architecture & Technology Stack

- **Framework**: Next.js 16 (App Router, Server-Side Rendering, Server Actions, Dynamic Metadata)
- **Styling & Design System**: Tailwind CSS v4 with custom B2B footwear palette:
  - Deep Navy (`#172554`)
  - Charcoal (`#27272A`)
  - Warm Off-White (`#FAF9F6`)
  - Soft Slate (`#64748B`)
  - Subtle Warm Accent (`#F4B860`)
  - WhatsApp Green (`#25D366`)
- **Backend & Database**:
  - PostgreSQL hosted via Supabase
  - Supabase Auth for administrators
  - Supabase Storage for product images and assets
  - Row Level Security (RLS) on all 9 tables
- **Validation**: Zod (shared client and server schemas)
- **Icons**: Lucide Icons
- **Testing**: Vitest automated test suite

---

## 2. Project Structure

```
wholesale-footwear/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                      # Homepage (Hero, Categories, Running designs, Strengths)
│   │   │   ├── products/page.tsx             # Full Catalogue with search, filters, pagination
│   │   │   ├── products/[slug]/page.tsx      # Permanent shareable product page with SEO & WhatsApp CTA
│   │   │   ├── about/page.tsx                # About Us with editable strengths & transport regions
│   │   │   ├── contact/page.tsx              # Wholesale contact coordinates & validated form
│   │   │   ├── terms/page.tsx                # Commercial wholesale terms, MOQ & transport policy
│   │   │   └── privacy/page.tsx              # B2B privacy policy
│   │   ├── admin/
│   │   │   ├── login/page.tsx                # Secure staff login
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx                # Protected layout with auth session guard
│   │   │       ├── page.tsx                  # Operational overview metrics & recent enquiries
│   │   │       ├── products/page.tsx         # Product catalog management (Publish/Unpublish, Duplicate, Delete)
│   │   │       ├── products/new/page.tsx     # Add new footwear article form
│   │   │       ├── products/[id]/edit/page.tsx # Edit article specifications & images
│   │   │       ├── categories/page.tsx       # Footwear categories management
│   │   │       ├── enquiries/page.tsx        # Retailer enquiry inbox with status workflow & private notes
│   │   │       └── business-settings/page.tsx# No-code editor for WhatsApp number, hero, terms & address
│   │   ├── api/
│   │   │   ├── enquiries/route.ts            # Public rate-limited enquiry API with honeypot spam protection
│   │   │   └── admin/...                     # Protected admin mutation APIs
│   │   ├── sitemap.ts                        # Dynamic XML sitemap excluding draft products
│   │   ├── robots.ts                         # Robots.txt protecting /admin/ endpoints
│   │   ├── globals.css                       # Design system and theme tokens
│   │   └── layout.tsx                        # Root layout with Organization JSON-LD & WhatsApp floating button
│   ├── components/
│   │   ├── Navbar.tsx                        # Responsive navigation with accessible mobile drawer
│   │   ├── Footer.tsx                        # Footer with wholesale information & admin portal link
│   │   ├── ProductCard.tsx                   # Product card with MOQ, sizes, and WhatsApp link
│   │   ├── ProductGallery.tsx                # Thumbnail switcher and photo previewer
│   │   ├── CatalogueFilter.tsx               # Category chips, brand selector, search & sort
│   │   ├── ContactForm.tsx                   # Client-side validated form with spam trap
│   │   ├── WhatsAppButton.tsx                # Click-to-chat generator with prefilled messages
│   │   └── admin/                            # Sidebar, Header, ProductForm components
│   └── lib/
│       ├── types.ts                          # Domain TypeScript interfaces
│       ├── validation.ts                     # Zod validation schemas
│       ├── whatsapp.ts                       # WhatsApp Click-to-Chat URL formatter
│       ├── auth.ts                           # Server-side admin role & session verification
│       ├── data-service.ts                   # Resilient service layer (Supabase + local fallback)
│       └── mock-data.ts                      # High quality seed & offline dev inventory
├── supabase/
│   └── migrations/
│       ├── 20261016_init_schema.sql          # PostgreSQL tables, constraints, indexes & triggers
│       ├── 20261016_rls_policies.sql         # Row Level Security policies & storage buckets
│       └── 20261016_seed_data.sql            # Seed categories, products, and default business settings
├── vitest.config.ts                          # Test runner configuration
└── package.json
```

---

## 3. Environment Configuration

Copy the example file to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain for sitemaps and links | `https://wholesale-footwear.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key (Safe for browser) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged secret key (**Server only - never commit!**) | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET_PRODUCTS` | Storage bucket for product images | `product-images` |
| `SUPABASE_STORAGE_BUCKET_ASSETS` | Storage bucket for company assets | `business-assets` |

> [!NOTE]
> When `NEXT_PUBLIC_SUPABASE_URL` is omitted in local development, the application automatically runs using the built-in resilient in-memory data store with realistic seed inventory.

---

## 4. Supabase Setup & Database Migrations

1. Create a new project in [Supabase](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Run the migrations in the following order:
   - Run `supabase/migrations/20261016_init_schema.sql` (Creates tables, triggers, and performance indexes).
   - Run `supabase/migrations/20261016_rls_policies.sql` (Enables Row Level Security on all tables and creates policies).
   - Run `supabase/migrations/20261016_seed_data.sql` (Inserts initial footwear categories, master carton products, and company configuration).

### Row Level Security (RLS) Rules Summary

- **Products**: Anonymous users can only `SELECT` records where `status = 'published'`. Only authenticated administrators can `INSERT`, `UPDATE`, or `DELETE`.
- **Categories**: Anonymous visitors see only active categories (`is_active = true`).
- **Enquiries**: Anyone can `INSERT` an enquiry. Only authenticated administrators can view, update status, add notes, or delete enquiries.
- **Enquiry Notes**: Strictly private to authorized administrators.
- **Profiles**: Non-administrators are blocked from updating their own role via a PostgreSQL trigger (`check_profile_role_update`).

---

## 5. Storage Bucket Setup

The storage buckets are defined in `supabase/migrations/20261016_rls_policies.sql`:

1. Bucket `product-images` (Public read, Admin write).
2. Bucket `business-assets` (Public read, Admin write).

To verify in the Supabase Dashboard:
1. Go to **Storage**.
2. Verify `product-images` and `business-assets` are created with **Public bucket** enabled.

---

## 6. Administrator Account Provisioning

To prevent public self-registration vulnerabilities, admin registration is strictly controlled:

1. In Supabase Dashboard, go to **Authentication -> Users** and click **Invite User** or **Add User** (e.g. `admin@apexfootwear.example.com`).
2. Once the user is created, promote their account to an administrator by running this query in the **SQL Editor**:

```sql
insert into public.profiles (id, email, role, full_name)
values (
  'PASTE_AUTH_USER_UUID_HERE',
  'admin@apexfootwear.example.com',
  'admin',
  'Lead Wholesale Admin'
)
on conflict (id) do update set role = 'admin';
```

3. The user can now log in at `/admin/login`.

---

## 7. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
# Public site:  http://localhost:3000
# Admin portal: http://localhost:3000/admin/login
```

For local preview without live Supabase credentials:
- Email: `admin@apexfootwear.example.com`
- Password: `Admin@12345`

---

## 8. Automated Testing & Verification

Run the test suite:

```bash
npm test
```

The automated test suite verifies:
- WhatsApp click-to-chat parameter sanitation and prefilled message construction.
- Client and server-side Zod validation schemas.
- Honeypot spam bot trapping and rate limiting.
- Catalogue queries ensuring unpublished/draft items are strictly excluded from public visitors.
- Admin product CRUD, duplicate, and publication workflows.
- Category deletion safety checks when products are currently assigned.
- Enquiry management and internal private note logging.
- SQL RLS policy syntax and coverage on all tables.

To build the production application:

```bash
npm run build
```

---

## 9. Routine Operations Without Editing Code

The business owner or staff can manage the business entirely from `/admin/dashboard`:

1. **Add / Edit Products**:
   - Go to **Products Catalogue** -> Click **Add New Product**.
   - Fill in name, carton sizes (e.g. `6, 7, 8, 9, 10`), minimum order quantity (MOQ), wholesale rate, and paste or upload photographs.
   - Choose **Save Draft** to preview privately or **Publish to Catalogue** to make it public.
2. **Toggle Publication Status**:
   - In the products list, click the status badge (`Published` / `Draft`) to immediately publish or take down an article.
3. **Update Business Numbers & WhatsApp**:
   - Go to **Business & Terms**.
   - Update phone numbers, WhatsApp click-to-chat destination, depot address, or operating hours.
   - Update minimum order policy, transport bilty guidelines, or return terms.
   - Click **Save & Publish Changes** — updates appear on the public website immediately.
4. **Manage Incoming Enquiries**:
   - Go to **Enquiries Inbox**.
   - Click any enquiry to review buyer shop details, update status (`New` -> `Contacted` -> `In Progress` -> `Converted`), set follow-up dates, and record internal private notes.

---

## 10. Production Deployment (Vercel / Node)

### Deploying on Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Framework Preset to **Next.js**.
4. In **Settings -> Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://yourdomain.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**.

---

## 11. Custom Domain & DNS Setup

To attach your custom domain (e.g. `apexfootwear.com`):

1. In Vercel, go to **Settings -> Domains** and add `apexfootwear.com` and `www.apexfootwear.com`.
2. In your DNS Registrar (GoDaddy, Namecheap, Cloudflare):
   - **A Record**: Point `@` to `76.76.21.21`
   - **CNAME Record**: Point `www` to `cname.vercel-dns.com`
3. Wait for DNS propagation (typically 5 to 60 minutes).

---

## 12. HTTPS & Security Hardening

- Next.js automatically enforces the following security headers in `next.config.mjs`:
  - `X-Frame-Options: DENY` (Clickjacking prevention)
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Enquiries are rate-limited and protected with a honeypot field (`website_hp`) to drop automated bot submissions without burdening legitimate users with intrusive captchas.
- All admin mutation APIs verify authorized administrator roles on every request.

---

## 13. SEO & Google Search Console Checklist

1. **Verify Sitemap**:
   - Visit `https://yourdomain.com/sitemap.xml` to ensure all published products, categories, and static pages are listed.
2. **Verify Robots**:
   - Visit `https://yourdomain.com/robots.txt` to verify crawler access is open while `/admin/` is protected.
3. **Submit to Google Search Console**:
   - Open [Google Search Console](https://search.google.com/search-console).
   - Add your custom domain property.
   - Go to **Sitemaps** -> Submit `sitemap.xml`.
4. **Structured Data Validation**:
   - Test your homepage and product pages on the [Rich Results Test](https://search.google.com/test/rich-results) to verify `Organization` and `Product` schemas.

---

## 14. Backup & Recovery Recommendations

- **Automated Daily Backups**: Supabase automatically creates daily backups for projects.
- **Manual Backups**: Export database snapshots periodically using the Supabase CLI:
  ```bash
  supabase db dump --data-only > backup_$(date +%Y%m%d).sql
  ```
- **Image Assets**: Store master footwear photographs in a secure external archive (Google Drive, S3, or local storage) in addition to Supabase Storage.
