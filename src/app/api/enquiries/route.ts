import { NextRequest, NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { submitEnquiry } from '@/lib/data-service';

// Basic in-memory rate limiting map: ip -> lastSubmissionTimestamp
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const lastTime = rateLimitMap.get(ip);

    // Limit to 1 submission every 5 seconds per IP
    if (lastTime && now - lastTime < 5000) {
      return NextResponse.json(
        { error: 'Please wait a few seconds before submitting another enquiry.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Check honeypot field for spam bots
    if (body.website_hp && body.website_hp.trim().length > 0) {
      // Bot detected, silently return success without saving
      return NextResponse.json({ success: true, message: 'Enquiry received' });
    }

    // Validate using Zod schema
    const parseResult = enquirySchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : 'Invalid form input' },
        { status: 400 }
      );
    }

    const validData = parseResult.data;

    // Save enquiry
    const savedEnquiry = await submitEnquiry({
      name: validData.name,
      shop_name: validData.shop_name || null,
      phone: validData.phone,
      email: validData.email || null,
      city: validData.city,
      enquiry_type: validData.enquiry_type,
      product_id: validData.product_id || null,
      product_name: validData.product_name || null,
      sku: validData.sku || null,
      message: validData.message,
    });

    rateLimitMap.set(ip, now);

    return NextResponse.json({
      success: true,
      enquiryId: savedEnquiry.id,
      message: 'Enquiry submitted successfully',
    });
  } catch (error: unknown) {
    console.error('Enquiry API Error:', error);
    return NextResponse.json(
      { error: 'Unable to process your enquiry at this time. Please contact us directly via WhatsApp or phone.' },
      { status: 500 }
    );
  }
}
