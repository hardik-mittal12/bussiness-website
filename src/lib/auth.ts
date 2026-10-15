import { createServerSupabaseClient } from './supabase/server';
import { cookies } from 'next/headers';
import { UserRole } from './types';

export interface AdminSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  } | null;
}

export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isAuthenticated: false, user: null };
    }

    // Check profile role in database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profile && profile.role === 'admin') {
      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email || '',
          role: 'admin',
          name: profile.full_name || user.email?.split('@')[0],
        },
      };
    }

    // Authenticated but not an admin!
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  // Fallback dev mode (ONLY allowed in non-production local development)
  if (process.env.NODE_ENV !== 'production') {
    const cookieStore = await cookies();
    const devAuth = cookieStore.get('dev_admin_session')?.value;
    if (devAuth === 'true') {
      return {
        isAuthenticated: true,
        user: {
          id: 'dev-admin-id',
          email: 'admin@apexfootwear.example.com',
          role: 'admin',
          name: 'Lead Wholesale Admin',
        },
      };
    }
  }

  return { isAuthenticated: false, user: null };
}
