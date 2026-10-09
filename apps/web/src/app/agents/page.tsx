'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Store, Search, MapPin, ShieldCheck, Star, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { AgentSummary } from '@tech-marketplace/shared';
import { AgentCard } from '@/components/marketplace/AgentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'];

export default function AgentsDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const { data: res, isLoading } = useQuery<{ success: boolean; data: AgentSummary[] }>({
    queryKey: ['agents-directory', searchTerm, selectedCity],
    queryFn: () => apiFetch('/agent/directory', { params: { search: searchTerm, city: selectedCity } })
  });

  const agents = res?.data || [];

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      
      {/* Hero Banner — Clean Onetech Enterprise Hub Showcase */}
      <div className="bg-white border-b border-neutral-200/80 pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Enterprise Hubs & Verified Stores</span>
          </nav>

          <div className="bg-[#F5F6F8] rounded-2xl border border-neutral-200/80 p-7 sm:p-10 relative overflow-hidden shadow-2xs">
            {/* Subtle decorative background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FFBE00]/10 via-[#0070F3]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/90 text-neutral-800 text-xs font-semibold shadow-2xs mb-3">
                <ShieldCheck className="w-4 h-4 text-[#0070F3]" />
                <span>All vendors physically inspected & serial validated</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-2.5">
                Verified Tech Agent <span className="text-[#0070F3]">Directory</span>
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal max-w-2xl">
                Direct access to certified physical electronics stores across Pakistan&apos;s premier tech hubs in Hafeez Centre, Techno City, Blue Area, and Saddar. Real walk-in stores with official receipts and manufacturer warranties.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-7 pt-5 border-t border-neutral-200/80">
                <div className="bg-white rounded-xl p-3 border border-neutral-200/70 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">4</div>
                  <div className="text-[11px] text-neutral-500 font-medium">Verified Physical Hubs</div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-neutral-200/70 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">83+</div>
                  <div className="text-[11px] text-neutral-500 font-medium">Hardware Listings</div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-neutral-200/70 shadow-2xs">
                  <div className="flex items-center gap-1 text-xl sm:text-2xl font-extrabold text-neutral-900">
                    <span>4.9</span>
                    <Star className="w-4 h-4 fill-[#FFBE00] text-[#FFBE00]" />
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium">Avg. Store Rating</div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-neutral-200/70 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">4</div>
                  <div className="text-[11px] text-neutral-500 font-medium">Major Tech Cities</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shop name, commercial market, or city..."
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-xs bg-white focus:outline-none focus:border-neutral-900 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCity('')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                !selectedCity
                  ? 'bg-[#FFBE00] text-neutral-900 border border-[#FFBE00]'
                  : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200'
              }`}
            >
              All Cities
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city === selectedCity ? '' : city)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  selectedCity === city
                    ? 'bg-[#FFBE00] text-neutral-900 border border-[#FFBE00]'
                    : 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{city}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <p>
            Showing <strong className="font-bold text-neutral-900">{agents.length}</strong> verified technology vendors
          </p>
          {selectedCity && (
            <button
              onClick={() => setSelectedCity('')}
              className="text-[#0070F3] hover:underline font-semibold"
            >
              Clear city filter
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
                <Skeleton className="w-full h-28 rounded-xl" />
                <Skeleton className="w-1/2 h-5" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-full h-8" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No verified shops found"
            description="Try clearing your city filter or searching for different keywords."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

