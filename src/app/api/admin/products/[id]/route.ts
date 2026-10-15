import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct, createProduct } from '@/lib/data-service';
import { productSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
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

    // Partial update validation
    const parseResult = productSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await updateProduct(id, {
      ...parseResult.data,
      images: body.images,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    console.error('Update product error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update product' },
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
    const success = await deleteProduct(id);
    if (!success) {
      return NextResponse.json({ error: 'Product not found or delete failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete product error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Duplicate product
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const original = await getProductById(id);
  if (!original) {
    return NextResponse.json({ error: 'Original product not found' }, { status: 404 });
  }

  const timestamp = Date.now().toString().slice(-4);
  const duplicated = await createProduct({
    ...original,
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${timestamp}`,
    sku: original.sku ? `${original.sku}-COPY` : null,
    status: 'draft', // duplicated items start as draft
    is_featured: false,
    images: original.images || [],
  });

  return NextResponse.json({ success: true, product: duplicated });
}
