import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getBrands, createBrand } from '@/lib/data-service';
import { brandSchema } from '@/lib/validation';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brands = await getBrands(true);
  return NextResponse.json(brands);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = brandSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid brand data' },
        { status: 400 }
      );
    }

    const created = await createBrand({
      name: parseResult.data.name,
      slug: parseResult.data.slug,
      description: parseResult.data.description ?? null,
      logo_url: parseResult.data.logo_url ?? null,
      display_order: parseResult.data.display_order,
      is_active: parseResult.data.is_active,
    });
    return NextResponse.json({ success: true, brand: created }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create brand error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create brand' },
      { status: 500 }
    );
  }
}
