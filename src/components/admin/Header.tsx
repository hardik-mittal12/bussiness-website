'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ShieldCheck, Loader2 } from 'lucide-react';

interface AdminHeaderProps {
  userEmail?: string;
  userName?: string;
}

export default function AdminHeader({ userEmail, userName }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Authorized Admin Session
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-900 block">
            {userName || 'Administrator'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono block">
            {userEmail || 'admin@apexfootwear.example.com'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          title="Sign out of Admin Dashboard"
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
