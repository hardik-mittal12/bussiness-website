import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import {
  bulkUpdateProductStatus,
  bulkAssignCategory,
  bulkDeleteProducts,
} from '@/lib/data-service';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'delete', 'assign_category']),
  ids: z.array(z.string().min(1)).min(1, 'Please select at least one product'),
  category_id: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = bulkActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid bulk action request' },
        { status: 400 }
      );
    }

    const { action, ids, category_id } = parseResult.data;

    switch (action) {
      case 'publish': {
        const result = await bulkUpdateProductStatus(ids, 'published');
        return NextResponse.json({ success: true, count: result.updatedCount });
      }
      case 'unpublish': {
        const result = await bulkUpdateProductStatus(ids, 'draft');
        return NextResponse.json({ success: true, count: result.updatedCount });
      }
      case 'archive': {
        const result = await bulkUpdateProductStatus(ids, 'archived');
        return NextResponse.json({ success: true, count: result.updatedCount });
      }
      case 'delete': {
        const result = await bulkDeleteProducts(ids);
        return NextResponse.json({ success: true, count: result.deletedCount });
      }
      case 'assign_category': {
        const result = await bulkAssignCategory(ids, category_id || null);
        return NextResponse.json({ success: true, count: result.updatedCount });
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('Bulk product action error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bulk action failed' },
      { status: 500 }
    );
  }
}
