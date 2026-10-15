import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updateEnquiryStatus, deleteEnquiry } from '@/lib/data-service';
import { EnquiryStatus } from '@/lib/types';

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
    const { status, follow_up_date } = await req.json();
    const updated = await updateEnquiryStatus(id, status as EnquiryStatus, follow_up_date);
    return NextResponse.json({ success: true, enquiry: updated });
  } catch (err: unknown) {
    console.error('Update enquiry error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update enquiry' },
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
    const success = await deleteEnquiry(id);
    if (!success) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete enquiry error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
