import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updateBrand, deleteBrand, getBrandById } from '@/lib/data-service';
import { brandSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const brand = await getBrandById(id);
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }
  return NextResponse.json(brand);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const parseResult = brandSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid brand data' },
        { status: 400 }
      );
    }

    const updated = await updateBrand(id, parseResult.data);
    return NextResponse.json({ success: true, brand: updated });
  } catch (err: unknown) {
    console.error('Update brand error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update brand' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const res = await deleteBrand(id);
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to delete brand' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete brand error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
