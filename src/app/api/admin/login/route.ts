import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      // Check if user has admin role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        // Sign out user immediately if they are not an authorized admin
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: 'Access denied: You do not have administrator permissions.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, redirect: '/admin/dashboard' });
    }

    // In production, Supabase Auth is strictly required - no dev credential bypass
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Supabase authentication service is not configured in this production environment.' },
        { status: 503 }
      );
    }

    // Local / Dev Fallback mode ONLY allowed in non-production development with exact credentials
    if (email === 'admin@apexfootwear.example.com' && password === 'Admin@12345') {
      const cookieStore = await cookies();
      cookieStore.set('dev_admin_session', 'true', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({ success: true, redirect: '/admin/dashboard' });
    }

    return NextResponse.json(
      { error: 'Invalid credentials. For local dev preview, use admin@apexfootwear.example.com / Admin@12345' },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error('Admin Login Error:', error);
    return NextResponse.json(
      { error: 'An authentication error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
