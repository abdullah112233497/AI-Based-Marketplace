'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, Star, ArrowRight } from 'lucide-react';
import { AgentSummary } from '@tech-marketplace/shared';

interface AgentCardProps {
  agent: AgentSummary;
}

const LOGO_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f9fafb' width='80' height='80'/%3E%3Ctext x='50%25' y='55%25' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23111827' font-family='Arial' font-weight='bold'%3E${'S'}%3C/text%3E%3C/svg%3E`;

export function AgentCard({ agent }: AgentCardProps) {
  const [logoSrc, setLogoSrc] = useState(agent.logoUrl || LOGO_PLACEHOLDER);

  return (
    <Link
      href={`/agents/${agent.shopSlug || agent.id}`}
      className="group bg-white rounded-xl border border-neutral-200/80 p-6 flex flex-col justify-between hover:border-[#FFBE00] hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-2xs"
    >
      <div>
        {/* Hub Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="relative w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-200/80 overflow-hidden shrink-0">
            <Image
              src={logoSrc}
              alt={agent.shopName}
              fill
              onError={() => setLogoSrc(LOGO_PLACEHOLDER)}
              className="object-cover"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
            <span>{agent.city}</span>
          </div>
        </div>

        {/* Store Title & Verification */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-neutral-900 text-base group-hover:text-[#0070F3] transition-colors">
              {agent.shopName}
            </h3>
            {agent.isVerified && (
              <span title="Verified Storefront" className="inline-flex items-center">
                <ShieldCheck className="w-4 h-4 text-[#0070F3] shrink-0" />
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 line-clamp-1">
            {agent.address || 'Certified Physical Technology Hub'}
          </p>
        </div>

        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mt-2">
          {agent.shopDescription || 'Direct electronics distributor and verified retail partner.'}
        </p>
      </div>

      {/* Footer Meta */}
      <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-neutral-900 font-bold">
            <Star className="w-3.5 h-3.5 fill-[#FFBE00] text-[#FFBE00]" />
            <span>{agent.rating.toFixed(1)}</span>
            <span className="text-neutral-400 font-normal">({agent.ratingCount})</span>
          </div>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-500 font-medium">{agent.productCount || 20}+ items</span>
        </div>

        <div className="text-neutral-400 group-hover:text-[#0070F3] group-hover:translate-x-1 transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
