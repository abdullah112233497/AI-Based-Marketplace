'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useCompare } from '@/lib/compare-context';
import { Button } from '../ui/Button';
import { formatPKR } from '@/lib/utils';

export function CompareBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-teal-200 shadow-2xl p-3 animate-in slide-in-from-bottom-5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left info & Clear */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink">Compare Matrix ({compareItems.length}/4)</h4>
            <button
              onClick={clearCompare}
              className="text-[11px] text-ink-muted hover:text-rose-600 underline"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Selected Items Previews */}
        <div className="flex items-center gap-3 overflow-x-auto py-1 max-w-full">
          {compareItems.map(item => (
            <div
              key={item.id}
              className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 pr-3 shrink-0"
            >
              <div className="relative w-8 h-8 rounded bg-white overflow-hidden shrink-0">
                <Image
                  src={item.images[0] || ''}
                  alt={item.title}
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div className="max-w-[120px]">
                <p className="text-[11px] font-semibold text-ink truncate">{item.title}</p>
                <p className="text-[10px] text-teal-700 font-bold">{formatPKR(item.basePrice)}</p>
              </div>
              <button
                onClick={() => removeFromCompare(item.id)}
                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] ml-1 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div>
          <Link href="/compare">
            <Button variant="primary" size="sm" className="whitespace-nowrap flex items-center gap-1.5">
              <span>Compare Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
