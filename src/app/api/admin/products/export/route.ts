import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProducts } from '@/lib/data-service';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { products } = await getProducts({ status: 'all', limit: 1000 });

    const headers = [
      'ID',
      'Name',
      'Slug',
      'SKU',
      'Category',
      'Brand',
      'Status',
      'Wholesale Price',
      'Price Visibility',
      'MOQ',
      'Availability Status',
      'Sizes',
      'Material',
      'Packaging Type',
      'Pairs Per Carton',
      'Units Per Package',
      'Carton Dimensions',
      'Carton Weight',
      'Packaging Included',
      'Colour Variants',
      'Primary Image URL',
      'Created At',
    ];

    const rows = products.map((p) => {
      const variantsSummary = (p.variants || [])
        .map((v) => `${v.colour_name}${v.hex_code ? ` (${v.hex_code})` : ''}${v.variant_sku ? ` [${v.variant_sku}]` : ''}`)
        .join('; ');

      const primaryImg = p.images?.find((img) => img.is_primary)?.image_url || p.images?.[0]?.image_url || '';

      return [
        escapeCsvField(p.id),
        escapeCsvField(p.name),
        escapeCsvField(p.slug),
        escapeCsvField(p.sku || ''),
        escapeCsvField(p.category?.name || ''),
        escapeCsvField(p.brand?.name || ''),
        escapeCsvField(p.status),
        escapeCsvField(p.wholesale_price !== null ? p.wholesale_price : ''),
        escapeCsvField(p.price_visibility),
        escapeCsvField(p.moq),
        escapeCsvField(p.availability_status),
        escapeCsvField((p.available_sizes || []).join(', ')),
        escapeCsvField(p.material || ''),
        escapeCsvField(p.packaging_type?.name || ''),
        escapeCsvField(p.packaging_pairs_per_carton ?? ''),
        escapeCsvField(p.packaging_units_per_package ?? ''),
        escapeCsvField(p.carton_dimensions || ''),
        escapeCsvField(p.carton_weight || ''),
        escapeCsvField(p.packaging_included_in_price ? 'Yes' : 'No'),
        escapeCsvField(variantsSummary),
        escapeCsvField(primaryImg),
        escapeCsvField(p.created_at),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wholesale-footwear-products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err: unknown) {
    console.error('Export products error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    );
  }
}
