import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updatePackagingType, deletePackagingType, getPackagingTypeById } from '@/lib/data-service';
import { packagingTypeSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pkg = await getPackagingTypeById(id);
  if (!pkg) {
    return NextResponse.json({ error: 'Packaging type not found' }, { status: 404 });
  }
  return NextResponse.json(pkg);
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
    const parseResult = packagingTypeSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid packaging type data' },
        { status: 400 }
      );
    }

    const updated = await updatePackagingType(id, parseResult.data);
    return NextResponse.json({ success: true, packagingType: updated });
  } catch (err: unknown) {
    console.error('Update packaging type error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update packaging type' },
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
    const res = await deletePackagingType(id);
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to delete packaging type' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete packaging type error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
