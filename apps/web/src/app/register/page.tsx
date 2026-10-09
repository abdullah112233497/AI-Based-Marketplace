'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { RegisterCustomerSchema, RegisterCustomerInput } from '@tech-marketplace/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

export default function RegisterCustomerPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterCustomerInput>({
    resolver: zodResolver(RegisterCustomerSchema)
  });

  const onSubmit = async (data: RegisterCustomerInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (res?.data) {
        login(res.data.token, res.data.user);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-border p-8 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Get Rs. 500 Welcome Wallet Bonus</span>
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight">Create Customer Account</h2>
          <p className="text-xs text-ink-muted">Join Pakistan’s verified spec-driven electronics hub</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                {...register('name')}
                placeholder="Usman Ali"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pakistani Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                {...register('phone')}
                placeholder="03001234567"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 chars)</label>
            <div className="relative">
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            <span>Register Customer</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-ink-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-700 font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
