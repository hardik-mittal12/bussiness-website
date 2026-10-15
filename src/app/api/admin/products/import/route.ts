import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  getCategories,
  getBrands,
  getPackagingTypes,
  createProduct,
  updateProduct,
  getProductBySlug,
  ProductInput,
} from '@/lib/data-service';

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        row.push(field.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { csvContent, dryRun = false } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Valid CSV content is required' }, { status: 400 });
    }

    const rows = parseCsv(csvContent);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have a header row and at least one data row' },
        { status: 400 }
      );
    }

    const header = rows[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const dataRows = rows.slice(1);

    // Fetch lookups for categories, brands, packaging
    const [categories, brands, packagingTypes] = await Promise.all([
      getCategories(true),
      getBrands(true),
      getPackagingTypes(true),
    ]);

    const findCol = (aliases: string[]) =>
      header.findIndex((h) => aliases.some((a) => h.includes(a)));

    const nameIdx = findCol(['name', 'title', 'product_name']);
    const slugIdx = findCol(['slug']);
    const skuIdx = findCol(['sku', 'code']);
    const catIdx = findCol(['category', 'category_name']);
    const brandIdx = findCol(['brand', 'brand_name']);
    const priceIdx = findCol(['price', 'wholesale_price']);
    const moqIdx = findCol(['moq', 'min_order']);
    const sizesIdx = findCol(['size', 'sizes', 'available_sizes']);
    const materialIdx = findCol(['material']);
    const statusIdx = findCol(['status']);
    const pkgIdx = findCol(['packaging', 'packaging_type']);
    const cartonPairsIdx = findCol(['pairs_per_carton', 'carton_pairs']);
    const variantsIdx = findCol(['variants', 'colour_variants', 'colors']);
    const imgIdx = findCol(['image', 'image_url', 'primary_image']);

    if (nameIdx === -1) {
      return NextResponse.json(
        { error: 'CSV is missing a required "Name" column' },
        { status: 400 }
      );
    }

    interface ParsedRow {
      rowNumber: number;
      productData: ProductInput;
      existingProductSlug?: string;
      errors: string[];
    }

    const parsedResults: ParsedRow[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // 1-indexed, accounting for header
      const errors: string[] = [];

      const name = nameIdx !== -1 ? row[nameIdx] : '';
      if (!name) {
        errors.push('Product name is required');
      }

      let slug = slugIdx !== -1 && row[slugIdx] ? row[slugIdx] : '';
      if (!slug && name) {
        slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }

      const sku = skuIdx !== -1 ? row[skuIdx] : null;

      // Category matching
      let categoryId: string | null = null;
      if (catIdx !== -1 && row[catIdx]) {
        const catVal = row[catIdx].toLowerCase();
        const matched = categories.find(
          (c) => c.name.toLowerCase() === catVal || c.slug.toLowerCase() === catVal
        );
        if (matched) {
          categoryId = matched.id;
        } else {
          errors.push(`Category "${row[catIdx]}" not found`);
        }
      }

      // Brand matching
      let brandId: string | null = null;
      if (brandIdx !== -1 && row[brandIdx]) {
        const brandVal = row[brandIdx].toLowerCase();
        const matched = brands.find(
          (b) => b.name.toLowerCase() === brandVal || b.slug.toLowerCase() === brandVal
        );
        if (matched) {
          brandId = matched.id;
        } else {
          errors.push(`Brand "${row[brandIdx]}" not found`);
        }
      }

      // Packaging matching
      let packagingTypeId: string | null = null;
      if (pkgIdx !== -1 && row[pkgIdx]) {
        const pkgVal = row[pkgIdx].toLowerCase();
        const matched = packagingTypes.find(
          (p) => p.name.toLowerCase() === pkgVal || p.slug.toLowerCase() === pkgVal
        );
        if (matched) {
          packagingTypeId = matched.id;
        }
      }

      const priceVal = priceIdx !== -1 && row[priceIdx] ? parseFloat(row[priceIdx]) : null;
      const moqVal = moqIdx !== -1 && row[moqIdx] ? parseInt(row[moqIdx], 10) : 12;
      const statusVal =
        statusIdx !== -1 && ['published', 'draft', 'archived'].includes(row[statusIdx].toLowerCase())
          ? (row[statusIdx].toLowerCase() as 'published' | 'draft' | 'archived')
          : 'draft';

      // Parse sizes (split by comma, semicolon, or pipe)
      const sizes =
        sizesIdx !== -1 && row[sizesIdx]
          ? row[sizesIdx]
              .split(/[,;|]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      // Parse colour variants: e.g. "Black (#000000), Tan (#D2B48C)"
      const variants: ProductInput['variants'] = [];
      if (variantsIdx !== -1 && row[variantsIdx]) {
        const parts = row[variantsIdx].split(/[,;]/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((part, vIdx) => {
          const hexMatch = part.match(/\((#[0-9a-fA-F]{3,6})\)/);
          const colourName = part.replace(/\s*\([#\w]+\)\s*/, '').trim();
          if (colourName) {
            variants.push({
              colour_name: colourName,
              hex_code: hexMatch ? hexMatch[1] : null,
              display_order: vIdx,
              is_active: true,
            });
          }
        });
      }

      const images: ProductInput['images'] = [];
      if (imgIdx !== -1 && row[imgIdx]) {
        images.push({
          image_url: row[imgIdx],
          alt_text: name,
          display_order: 0,
          is_primary: true,
        });
      }

      const pairsPerCarton = cartonPairsIdx !== -1 && row[cartonPairsIdx] ? parseInt(row[cartonPairsIdx], 10) : null;

      parsedResults.push({
        rowNumber,
        productData: {
          name,
          slug,
          sku: sku || null,
          category_id: categoryId,
          brand_id: brandId,
          packaging_type_id: packagingTypeId,
          packaging_pairs_per_carton: pairsPerCarton,
          wholesale_price: !isNaN(priceVal as number) ? priceVal : null,
          moq: !isNaN(moqVal) ? moqVal : 12,
          status: statusVal,
          material: materialIdx !== -1 ? row[materialIdx] || null : null,
          available_sizes: sizes,
          variants: variants.length > 0 ? variants : undefined,
          images: images.length > 0 ? images : undefined,
        },
        errors,
      });
    }

    const totalRows = parsedResults.length;
    const validRows = parsedResults.filter((r) => r.errors.length === 0);
    const invalidRows = parsedResults.filter((r) => r.errors.length > 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalRows,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        samplePreview: validRows.slice(0, 5).map((r) => r.productData),
        errors: invalidRows.map((r) => ({ row: r.rowNumber, errors: r.errors })),
      });
    }

    // Execute actual import
    let imported = 0;
    const importErrors: { row: number; error: string }[] = [];

    for (const item of validRows) {
      try {
        const existing = await getProductBySlug(item.productData.slug!, true);
        if (existing) {
          await updateProduct(existing.id, item.productData);
        } else {
          await createProduct(item.productData);
        }
        imported++;
      } catch (err: unknown) {
        importErrors.push({
          row: item.rowNumber,
          error: err instanceof Error ? err.message : 'Unknown import error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: totalRows,
      importedCount: imported,
      failedCount: invalidRows.length + importErrors.length,
      errors: [
        ...invalidRows.map((r) => ({ row: r.rowNumber, error: r.errors.join('; ') })),
        ...importErrors,
      ],
    });
  } catch (err: unknown) {
    console.error('Import CSV error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse or import CSV' },
      { status: 500 }
    );
  }
}
