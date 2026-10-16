import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getBusinessSettings, updateBusinessSettings } from '@/lib/data-service';
import { businessSettingsSchema } from '@/lib/validation';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getBusinessSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = businessSettingsSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid settings data' },
        { status: 400 }
      );
    }

    const updated = await updateBusinessSettings(parseResult.data);
    
    // Purge cached HTML across homepage and root layout so new settings render immediately
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
    } catch (e) {
      console.warn('Revalidation warning:', e);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    console.error('Update settings error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
