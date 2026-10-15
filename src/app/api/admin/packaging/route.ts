import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getPackagingTypes, createPackagingType } from '@/lib/data-service';
import { packagingTypeSchema } from '@/lib/validation';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const packagingTypes = await getPackagingTypes(true);
  return NextResponse.json(packagingTypes);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = packagingTypeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid packaging type data' },
        { status: 400 }
      );
    }

    const created = await createPackagingType({
      name: parseResult.data.name,
      slug: parseResult.data.slug,
      description: parseResult.data.description ?? null,
      image_url: parseResult.data.image_url ?? null,
      display_order: parseResult.data.display_order,
      is_active: parseResult.data.is_active,
      is_default: parseResult.data.is_default,
    });
    return NextResponse.json({ success: true, packagingType: created }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create packaging type error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create packaging type' },
      { status: 500 }
    );
  }
}
