import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getEnquiries } from '@/lib/data-service';
import { EnquiryStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') as EnquiryStatus | 'all') || 'all';
  const search = searchParams.get('q') || undefined;

  const enquiries = await getEnquiries({ status, search });
  return NextResponse.json(enquiries);
}
