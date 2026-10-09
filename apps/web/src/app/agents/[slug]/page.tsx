'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, MapPin, Phone, Star, Package, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { AgentSummary, ProductSummary } from '@tech-marketplace/shared';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function AgentProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: res, isLoading } = useQuery<{
    success: boolean;
    data: AgentSummary & { products: ProductSummary[] };
  }>({
    queryKey: ['agent-profile', slug],
    queryFn: () => apiFetch(`/agent/public/${slug}`),
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <Skeleton className="w-1/3 h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const agent = res?.data;

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Shop Not Found</h2>
        <Link href="/agents"><Button variant="primary">Return to Directory</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner & Shop Card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="relative w-full h-48 sm:h-64 bg-slate-900">
          {agent.bannerUrl && (
            <Image src={agent.bannerUrl} alt={agent.shopName} fill className="object-cover opacity-80" />
          )}
        </div>

        <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden shrink-0">
              <Image src={agent.logoUrl || ''} alt={agent.shopName} fill className="object-cover" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{agent.shopName}</h1>
                {agent.isVerified && (
                  <span className="p-1 rounded-full bg-teal-50 text-teal-600">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {agent.address}, {agent.city}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {agent.contactPhone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm justify-center">
                <Star className="w-4 h-4 fill-amber-400" /> {agent.rating.toFixed(1)}
              </div>
              <p className="text-[10px] text-ink-muted">({agent.ratingCount} reviews)</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="font-extrabold text-sm text-teal-800">{agent.products?.length || 0}</p>
              <p className="text-[10px] text-ink-muted">Listings</p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 text-xs text-ink-muted max-w-3xl leading-relaxed">
          {agent.shopDescription}
        </div>
      </div>

      {/* Agent's Inventory */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-ink tracking-tight">
          Current In-Stock Hardware by {agent.shopName}
        </h2>

        {agent.products && agent.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agent.products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted italic py-8">This merchant has no active public listings.</p>
        )}
      </div>

    </div>
  );
}
