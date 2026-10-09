'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { LoginSchema, LoginInput, UserRole } from '@tech-marketplace/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (res?.data) {
        login(res.data.token, res.data.user);

        if (res.data.user.role === UserRole.ADMIN) {
          router.push('/admin');
        } else if (res.data.user.role === UserRole.AGENT) {
          router.push('/agent');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-md w-full space-y-6 animate-fade-up">
        
        {/* Card */}
        <div className="bg-white rounded-3xl border border-border p-8 shadow-xl luxury-glow-subtle">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg luxury-glow-teal">
              TM
            </div>
            <h1 className="text-2xl font-black text-ink tracking-tight">Welcome Back</h1>
            <p className="text-xs text-ink-muted">Sign in to Tech Marketplace to access your account</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-[11px] shrink-0">!</span>
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Credentials Box */}
          <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1.5">
            <p className="font-extrabold text-ink text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Demo Accounts (Password: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">Admin123!</code>)
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { role: 'Admin', email: 'admin@techmarketplace.pk', color: 'text-violet-700 bg-violet-50 border-violet-200' },
                { role: 'Agent', email: 'lahore@techzone.pk', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                { role: 'Customer', email: 'customer@gmail.com', color: 'text-amber-700 bg-amber-50 border-amber-200' },
              ].map(({ role, email, color }) => (
                <div key={role} className={`p-2 rounded-xl border text-center ${color}`}>
                  <div className="font-bold text-[10px]">{role}</div>
                  <div className="font-mono text-[9px] truncate mt-0.5 opacity-80">{email.split('@')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-ink bg-slate-50 focus:bg-white transition-all focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm text-ink bg-slate-50 focus:bg-white transition-all focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">{errors.password.message}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-ink-muted mt-6">
            <p>
              New customer?{' '}
              <Link href="/register" className="text-teal-700 font-bold hover:underline hover:text-teal-900">
                Create customer account
              </Link>
            </p>
            <p>
              Are you a hardware retailer?{' '}
              <Link href="/register/agent" className="text-teal-700 font-bold hover:underline hover:text-teal-900">
                Register as verified agent
              </Link>
            </p>
          </div>
        </div>

        {/* Trust note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>Your data is secured with industry-standard encryption</span>
        </div>
      </div>
    </div>
  );
}
