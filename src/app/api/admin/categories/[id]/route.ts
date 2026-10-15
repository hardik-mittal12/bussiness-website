import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updateCategory, deleteCategory } from '@/lib/data-service';
import { categorySchema } from '@/lib/validation';

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
    const parseResult = categorySchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid category data' },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, parseResult.data);
    return NextResponse.json({ success: true, category: updated });
  } catch (err: unknown) {
    console.error('Update category error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update category' },
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
    const res = await deleteCategory(id);
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to delete category' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete category error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
