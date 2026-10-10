'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Terminal } from 'lucide-react';
import { LoginSchema, LoginInput, UserRole } from '@tech-marketplace/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: 'admin@techmarketplace.pk',
      password: 'Admin123!',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res?.data) {
        // Enforce strict Admin role check
        if (res.data.user.role !== UserRole.ADMIN) {
          setErrorMsg('Access Denied: This portal is strictly restricted to Platform Super Administrators. Customers and Vendors cannot log in here.');
          await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
          return;
        }

        login(res.data.token, res.data.user);
        router.push('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid administrator credentials. Access unauthorized.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setValue('email', 'admin@techmarketplace.pk');
    setValue('password', 'Admin123!');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
      {/* Top Bar / Security Status */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono uppercase tracking-wider text-[11px] text-emerald-400">Security Gateway Active</span>
        </div>
        <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]">
          <span>Public Marketplace</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Admin Authentication Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 mb-8 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 mx-auto flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                Super Admin Console
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Restricted to authorized platform operators & administrators
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 font-bold">!</span>
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Quick Credential Filler for Admin */}
          <div className="mb-6 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] text-slate-300 font-mono">admin@techmarketplace.pk</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                Admin Master Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@techmarketplace.pk"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                Secure Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Session...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Super Admin</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500">
          All administrative actions, commission adjustments, and vendor reviews are logged and audited with timestamps.
        </p>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[10px] text-slate-600 font-mono">
        Tech Marketplace Platform Control Engine v1.0 • Node & FastAPI Secure Cluster
      </div>
    </div>
  );
}
