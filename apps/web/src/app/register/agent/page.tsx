'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store, ShieldCheck, ArrowRight, Building, MapPin, FileText } from 'lucide-react';
import { RegisterAgentSchema, RegisterAgentInput } from '@tech-marketplace/shared';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

export default function RegisterAgentPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterAgentInput>({
    resolver: zodResolver(RegisterAgentSchema),
    defaultValues: {
      city: 'Lahore'
    }
  });

  const onSubmit = async (data: RegisterAgentInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch('/auth/register-agent', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (res?.data) {
        login(res.data.token, res.data.user);
        router.push('/agent');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Agent application submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-border p-8 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight">Become a Verified Tech Merchant</h2>
          <p className="text-xs text-ink-muted">
            Sell authentic hardware, publish dynamic spec listings, and receive verified agent status
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner Full Name</label>
              <input
                {...register('name')}
                placeholder="Bilal Farooq"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Business Name</label>
              <input
                {...register('shopName')}
                placeholder="TechZone Lahore"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.shopName && <p className="text-[11px] text-rose-600 mt-1">{errors.shopName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="vendor@domain.pk"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
              <input
                {...register('phone')}
                placeholder="03001234567"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City Hub</label>
              <input
                {...register('city')}
                placeholder="Lahore / Karachi / Islamabad"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNIC / Tax ID (NTN)</label>
              <input
                {...register('cnicOrTaxId')}
                placeholder="35201-1234567-1"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.cnicOrTaxId && <p className="text-[11px] text-rose-600 mt-1">{errors.cnicOrTaxId.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Shop Location & Address</label>
              <input
                {...register('address')}
                placeholder="Shop 42, 2nd Floor, Hafeez Centre, Lahore"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 chars)</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            <span>Submit Vendor Application</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p className="text-[11px] text-ink-muted text-center">
          Applications are vetted by admin team before public listing activation.
        </p>

      </div>
    </div>
  );
}
