import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { addEnquiryNote } from '@/lib/data-service';

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
    const { note } = await req.json();
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note text cannot be empty' }, { status: 400 });
    }

    await addEnquiryNote(id, note.trim());
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Add enquiry note error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add note' },
      { status: 500 }
    );
  }
}
