import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { duplicateProduct } from '@/lib/data-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const duplicated = await duplicateProduct(id);
    return NextResponse.json({ success: true, product: duplicated }, { status: 201 });
  } catch (err: unknown) {
    console.error('Duplicate product error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to duplicate product' },
      { status: 500 }
    );
  }
}
