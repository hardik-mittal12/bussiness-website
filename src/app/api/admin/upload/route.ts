import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type (${file.type}). Only JPEG, PNG, WebP, and AVIF are allowed.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5 MB.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `products/${filename}`;

    if (supabase) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'product-images';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Supabase Storage Upload Error:', error);
        return NextResponse.json(
          { error: `Storage upload failed: ${error.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        filename,
      });
    }

    // Local development fallback: convert to base64 data URL for offline preview
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Storage backend unconfigured in production environment.' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename,
    });
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload processing error' },
      { status: 500 }
    );
  }
}
