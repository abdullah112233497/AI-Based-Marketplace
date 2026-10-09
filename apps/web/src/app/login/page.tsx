'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { LoginSchema, LoginInput, UserRole } from '@tech-marketplace/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
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

  const handleDemoSelect = (email: string) => {
    setValue('email', email);
    setValue('password', 'Admin123!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-[#F5F6F8]">
      <div className="max-w-md w-full space-y-6">
        
        {/* Main Login Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
          
          {/* Header & Logo */}
          <div className="text-center space-y-2 mb-8">
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
            <h1 className="text-xl font-bold text-neutral-900">Sign In to Your Account</h1>
            <p className="text-xs text-neutral-500">Access orders, compare matrix, and verified merchant deals</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-[#DF2020] text-xs font-medium flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#DF2020] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Demo Credentials Quick Switcher */}
          <div className="mb-6 p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFBE00]" />
                Demo Credentials (Click to fill)
              </span>
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded">
                Admin123!
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('customer@gmail.com')}
                className="p-1.5 rounded border border-neutral-200 bg-white hover:border-[#FFBE00] text-[10px] font-semibold text-neutral-800 transition-colors"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('lahore@techzone.pk')}
                className="p-1.5 rounded border border-neutral-200 bg-white hover:border-[#FFBE00] text-[10px] font-semibold text-neutral-800 transition-colors"
              >
                Merchant
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('admin@techmarketplace.pk')}
                className="p-1.5 rounded border border-neutral-200 bg-white hover:border-[#FFBE00] text-[10px] font-semibold text-neutral-800 transition-colors"
              >
                Super Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Password
                </label>
                <Link href="#" className="text-[11px] text-[#0070F3] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 rounded-md text-xs text-neutral-900 bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-[#DF2020] mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Yellow Onetech Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6 pt-5 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-[#DF2020] hover:underline">
                Sign Up Now
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
