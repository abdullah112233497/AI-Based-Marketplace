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

export default function RegisterCustomerPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterCustomerInput>({
    resolver: zodResolver(RegisterCustomerSchema),
  });

  const onSubmit = async (data: RegisterCustomerInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-[#F5F6F8]">
      <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 shadow-sm space-y-6">
        
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-8 h-8 fill-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#0070F3" />
                <path d="M18 2L32 10L18 18L4 10L18 2Z" fill="#FFBE00" />
                <path d="M18 18L32 10V26L18 34V18Z" fill="#00BCD4" />
                <path d="M4 10L18 18V34L4 26V10Z" fill="#0284C7" />
              </svg>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
              Onetech
            </span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E1] text-neutral-900 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#FFBE00]" />
            <span>Get Rs. 500 Welcome Wallet Bonus</span>
          </div>

          <h2 className="text-xl font-bold text-neutral-900">Create Your Account</h2>
          <p className="text-xs text-neutral-500">Join Pakistan’s verified technology hardware marketplace</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-[#DF2020] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                {...register('name')}
                placeholder="Usman Ali"
                className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.name && <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                {...register('phone')}
                placeholder="03001234567"
                className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Password (min 8 chars)</label>
            <div className="relative">
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.password.message}</p>}
          </div>

          {/* Bold Red Sign Up Button matching Header */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#DF2020] hover:bg-[#C91818] text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0070F3] font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
