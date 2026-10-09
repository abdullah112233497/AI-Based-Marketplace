'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store, Search, MapPin, ShieldCheck, Star, Grid, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 hero-mesh-bg opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 border border-white/10 text-teal-300 text-xs font-semibold mb-5 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>All vendors physically inspected & approved</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Verified Tech Agent Directory
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Direct access to certified physical electronics stores across Pakistan's top tech hubs.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-xs text-slate-400">
            <div className="text-center">
              <div className="text-2xl font-black text-white">4</div>
              <div>Verified Shops</div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">83+</div>
              <div>Listed Products</div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-teal-400">4.9</div>
              <div>Avg. Rating</div>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">4</div>
              <div>Cities</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-white rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shop name or city..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCity('')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                !selectedCity ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Cities
            </button>
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city === selectedCity ? '' : city)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedCity === city ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Showing <span className="font-bold text-ink">{agents.length}</span> verified tech vendors
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
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
            description="Try clearing your city filter or search keywords."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
