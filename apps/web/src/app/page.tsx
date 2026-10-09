'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Smartphone,
  Laptop,
  Headphones,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Clock,
  CheckCircle2,
  MapPin,
  Store,
  Award,
  Star,
  CreditCard,
  Package,
  Globe
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ProductSummary, AgentSummary } from '@tech-marketplace/shared';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { AgentCard } from '@/components/marketplace/AgentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatPKR } from '@/lib/utils';

export default function HomePage() {
  // Flash deal countdown timer simulation
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Featured Products (12 products)
  const { data: productsRes, isLoading: loadingProducts } = useQuery<{ success: boolean; data: ProductSummary[] }>({
    queryKey: ['home-products'],
    queryFn: () => apiFetch('/products?limit=12&sort=newest')
  });

  // Fetch Verified Agents (All 4 vendors)
  const { data: agentsRes, isLoading: loadingAgents } = useQuery<{ success: boolean; data: AgentSummary[] }>({
    queryKey: ['home-agents'],
    queryFn: () => apiFetch('/agent/directory')
  });

  const products = productsRes?.data || [];
  const agents = agentsRes?.data || [];
  const flashDeals = products.filter(p => p.compareAtPrice && p.compareAtPrice > p.basePrice).slice(0, 4);

  return (
    <div className="space-y-0 pb-16">
      
      {/* 1. Hero Section — Premium Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 hero-mesh-bg opacity-30"></div>
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1] mb-8 animate-fade-up">
            Buy Verified Tech. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-amber-300">
              Compare Specs Side-by-Side.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up stagger-2">
            Direct access to authenticated physical shops across Pakistan. Filter by RAM, GPU TDP, and PTA approval with 100% genuine seal guarantee.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link href="/products">
              <Button variant="primary" size="lg" className="shadow-lg shadow-teal-900/50 luxury-glow-teal px-8 py-4 text-sm">
                <span>Explore Full Catalog</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/compare">
              <Button variant="outline" size="lg" className="bg-white/5 border-white/15 text-white hover:bg-white/10 backdrop-blur-md px-8 py-4 text-sm">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-teal-400" />
                <span>Open Comparison Tool</span>
              </Button>
            </Link>
          </div>

          {/* Trust Metrics Row */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-[11px] text-slate-400 animate-fade-up stagger-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <span>IMEI Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Truck className="w-4 h-4 text-teal-400" />
              </div>
              <span>Nationwide Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-teal-400" />
              </div>
              <span>7-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-teal-400" />
              </div>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Navigation Tiles — Overlapping Hero Bottom */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <Link
            href="/products?category=mobiles"
            className="luxury-card rounded-2xl p-6 group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50/80 to-transparent rounded-bl-full -z-0 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink text-lg group-hover:text-brand transition-colors">
                  Mobiles & Tablets
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">Samsung, Apple, Xiaomi, Pixel, OnePlus</p>
                <span className="text-xs font-bold text-teal-700 inline-flex items-center gap-1 mt-2.5 group-hover:gap-2.5 transition-all">
                  Browse Smartphones <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/products?category=laptops"
            className="luxury-card rounded-2xl p-6 group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-50/80 to-transparent rounded-bl-full -z-0 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-sm">
                <Laptop className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink text-lg group-hover:text-amber-600 transition-colors">
                  Laptops & Computers
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">MacBooks, ROG, RTX 4090 GPUs, XPS</p>
                <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 mt-2.5 group-hover:gap-2.5 transition-all">
                  Browse Laptops <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/products?category=accessories"
            className="luxury-card rounded-2xl p-6 group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-50/80 to-transparent rounded-bl-full -z-0 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 text-violet-700 flex items-center justify-center font-bold shadow-sm">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink text-lg group-hover:text-violet-700 transition-colors">
                  Audio & Wearables
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">Sony ANC, Apple Watch, Keychron, Shure</p>
                <span className="text-xs font-bold text-violet-700 inline-flex items-center gap-1 mt-2.5 group-hover:gap-2.5 transition-all">
                  Browse Audio Gear <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* 3. Limited-Time Flash Deals — Premium Dark Card */}
      {flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-7 sm:p-10 shadow-2xl border border-teal-800/20 relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-teal-800/40">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg luxury-pulse-glow">
                  <Flame className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Verified Flash Deals
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Special merchant discounts with verified spec seals</p>
                </div>
              </div>

              {/* Live Countdown Timer */}
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/10 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Ends in:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}h</span>
                  <span className="text-amber-400">:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  <span className="text-amber-400">:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {flashDeals.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Verified Tech Merchants (All 4 Hubs) */}
      <section className="bg-gradient-to-b from-canvas to-teal-50/30 py-16 mt-16 border-y border-teal-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
                <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                </div>
                Physical Storefront Hubs
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                Verified Vendor Directory
              </h2>
              <p className="text-xs text-ink-muted mt-1.5">Authenticated physical stores across Pakistan with 20+ items each</p>
            </div>
            <Link href="/agents" className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200 hover:border-teal-300 transition-all hover:-translate-y-0.5">
              <span>View All Hubs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingAgents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-4">
                  <Skeleton className="w-full h-24 rounded-xl" />
                  <Skeleton className="w-1/2 h-5" />
                  <Skeleton className="w-3/4 h-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Full Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              </div>
              Latest Certified Arrivals
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Featured Tech Hardware
            </h2>
            <p className="text-xs text-ink-muted mt-1.5">Handpicked selection of trending certified devices</p>
          </div>
          <Link href="/products" className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200 hover:border-teal-300 transition-all hover:-translate-y-0.5">
            <span>Open Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-border p-4 space-y-3">
                <Skeleton className="w-full h-44 rounded-xl" />
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
                <Skeleton className="w-full h-8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Trust & Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-3xl border border-border p-8 sm:p-10 luxury-glow-subtle">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-ink">100% Genuine</h4>
                <p className="text-[11px] text-ink-muted mt-1">Every product verified through IMEI and serial check</p>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-ink">Fast Delivery</h4>
                <p className="text-[11px] text-ink-muted mt-1">24-48 hours nationwide with real-time tracking</p>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-sm">
                <RotateCcw className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-ink">7-Day Returns</h4>
                <p className="text-[11px] text-ink-muted mt-1">Full refund if any technical discrepancy found</p>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-ink">Spec Verified</h4>
                <p className="text-[11px] text-ink-muted mt-1">Hardware specs independently validated by experts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
