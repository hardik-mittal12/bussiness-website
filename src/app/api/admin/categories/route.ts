import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCategories, createCategory } from '@/lib/data-service';
import { categorySchema } from '@/lib/validation';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await getCategories(true);
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = categorySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid category' },
        { status: 400 }
      );
    }

    const created = await createCategory({
      name: parseResult.data.name,
      slug: parseResult.data.slug,
      description: parseResult.data.description ?? null,
      image_url: parseResult.data.image_url ?? null,
      display_order: parseResult.data.display_order,
      is_active: parseResult.data.is_active,
    });
    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create category error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create category' },
      { status: 500 }
    );
  }
}
