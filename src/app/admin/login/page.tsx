'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, KeyRound, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push(data.redirect || '/admin/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please verify credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDevCredentials = () => {
    setEmail('admin@apexfootwear.example.com');
    setPassword('Admin@12345');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center text-amber-400 font-bold text-2xl shadow-sm">
            AF
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin Operations Portal
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500">
          Secure management access for authorized staff only
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs rounded-2xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexfootwear.example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-950 bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-950 bg-white"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-950"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Local dev helper & security notice */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed">
              <span className="font-semibold block mb-0.5 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1 text-blue-800" />
                Security Notice:
              </span>
              Public registration is disabled. Administrator accounts are provisioned exclusively via Supabase Auth with Role Level Security verification.
            </div>

            <button
              type="button"
              onClick={fillDevCredentials}
              className="w-full py-1.5 px-3 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-center"
            >
              Autofill Local Dev Admin Credentials
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-blue-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
