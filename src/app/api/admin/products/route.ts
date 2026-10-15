import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProducts, createProduct } from '@/lib/data-service';
import { productSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'published' | 'draft' | 'archived' | 'all' || 'all';
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('q');

  const result = await getProducts({
    status,
    categorySlug,
    searchQuery,
    limit: 100,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = productSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const created = await createProduct({
      ...parseResult.data,
      images: body.images || [],
    });

    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create product error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}
