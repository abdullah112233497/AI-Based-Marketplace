'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, Star, Package, ArrowRight } from 'lucide-react';
import { AgentSummary } from '@tech-marketplace/shared';

interface AgentCardProps {
  agent: AgentSummary;
}

// Gradient banners as fallbacks — no external dependency
const CITY_GRADIENTS: Record<string, string> = {
  Lahore: 'from-teal-900 via-teal-800 to-emerald-900',
  Karachi: 'from-slate-900 via-blue-950 to-slate-800',
  Islamabad: 'from-violet-950 via-slate-900 to-teal-950',
  Rawalpindi: 'from-slate-900 via-slate-800 to-teal-900',
};

const LOGO_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f0fdfa' width='80' height='80'/%3E%3Ctext x='50%25' y='55%25' font-size='28' text-anchor='middle' dominant-baseline='middle' fill='%230f766e' font-family='Arial' font-weight='bold'%3ES%3C/text%3E%3C/svg%3E`;

export function AgentCard({ agent }: AgentCardProps) {
  const [bannerError, setBannerError] = useState(false);
  const [logoSrc, setLogoSrc] = useState(agent.logoUrl || LOGO_PLACEHOLDER);
  const gradientClass = CITY_GRADIENTS[agent.city] || 'from-slate-900 via-slate-800 to-teal-900';

  return (
    <div className="luxury-card rounded-3xl overflow-hidden flex flex-col justify-between group">
      {/* Banner */}
      <div className={`relative w-full h-28 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
        {!bannerError && agent.bannerUrl && (
          <Image
            src={agent.bannerUrl}
            alt={agent.shopName}
            fill
            onError={() => setBannerError(true)}
            className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
          />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        {/* Verified Badge */}
        <div className="absolute top-3 right-3">
          {agent.isVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-teal-300 backdrop-blur-md border border-teal-500/40 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Verified
            </span>
          )}
        </div>

        {/* City tag */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <MapPin className="w-2.5 h-2.5" />
            {agent.city}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pt-0 relative flex-1 flex flex-col">
        {/* Logo overlapping banner */}
        <div className="relative -mt-9 mb-3 w-16 h-16 rounded-2xl border-2 border-white shadow-lg bg-white overflow-hidden shrink-0">
          <Image
            src={logoSrc}
            alt={agent.shopName}
            fill
            onError={() => setLogoSrc(LOGO_PLACEHOLDER)}
            className="object-cover"
          />
        </div>

        <Link href={`/agents/${agent.shopSlug || agent.id}`}>
          <h3 className="font-extrabold text-ink text-base hover:text-brand transition-colors mb-1 leading-snug line-clamp-1">
            {agent.shopName}
          </h3>
        </Link>

        <p className="text-xs text-ink-muted line-clamp-2 mb-4 leading-relaxed">
          {agent.shopDescription || 'Verified hardware vendor and electronics distributor.'}
        </p>

        {/* Stats Row */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-amber-500 font-extrabold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{agent.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({agent.ratingCount})</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 font-bold bg-slate-100/80 px-2 py-0.5 rounded-lg">
            <Package className="w-3.5 h-3.5 text-teal-700" />
            <span>{agent.productCount || 20}+ Items</span>
          </div>

          <Link
            href={`/agents/${agent.shopSlug || agent.id}`}
            className="p-1.5 rounded-xl hover:bg-teal-50 text-teal-800 font-bold flex items-center gap-1 transition-all hover:scale-110"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
