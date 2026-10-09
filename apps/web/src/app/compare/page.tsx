'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X, ShoppingCart, ArrowLeft, Star, ShieldCheck } from 'lucide-react';
import { useCompare } from '@/lib/compare-context';
import { useCart } from '@/lib/cart-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPKR } from '@/lib/utils';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Cg transform='translate(150,150)'%3E%3Crect x='10' y='0' width='80' height='100' rx='8' fill='%23cbd5e1'/%3E%3Crect x='20' y='8' width='60' height='70' rx='4' fill='%23e2e8f0'/%3E%3Ccircle cx='50' cy='90' r='5' fill='%23e2e8f0'/%3E%3C/g%3E%3C/svg%3E`;

// Pretty labels for common spec keys
const SPEC_LABELS: Record<string, string> = {
  ram_gb: 'RAM',
  storage_gb: 'Storage',
  battery_mah: 'Battery',
  screen_size_inch: 'Screen Size',
  camera_mp: 'Camera',
  chipset: 'Chipset / CPU',
  cpu: 'Processor',
  gpu: 'GPU',
  network: 'Network',
  pta_approved: 'PTA Status',
  screen_refresh_rate: 'Refresh Rate',
  weight_kg: 'Weight',
  os: 'Operating System',
  connectivity: 'Connectivity',
  warranty_months: 'Warranty',
  accessory_type: 'Type',
  battery_life_hours: 'Battery Life',
};

function getSpecLabel(key: string): string {
  return SPEC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const [imgSrcs, setImgSrcs] = useState<Record<string, string>>({});

  const getImg = (id: string, original: string) => imgSrcs[id] || original || PLACEHOLDER_SVG;

  if (compareItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <EmptyState
          icon={SlidersHorizontal}
          title="Your comparison list is empty"
          description="Select up to 4 devices from the catalog to compare their specifications side-by-side."
          actionLabel="Browse Catalog"
          actionHref="/products"
        />
      </div>
    );
  }

  // Gather all unique spec keys
  const allSpecKeys = Array.from(
    new Set(compareItems.flatMap(item => Object.keys(item.specs || {})))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <Link href="/products" className="text-xs text-brand hover:text-teal-900 font-semibold flex items-center gap-1 mb-2 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Catalog
          </Link>
          <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-brand" />
            Side-by-Side Spec Comparison
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Comparing <span className="font-bold text-ink">{compareItems.length}</span> selected devices · differences highlighted in amber
          </p>
        </div>

        <button
          onClick={clearCompare}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl border border-rose-200 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Clear Comparison
        </button>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          
          {/* Header Row: Products info & Buy Actions */}
          <thead>
            <tr className="border-b border-border bg-slate-50">
              <th className="p-5 w-44 font-bold text-slate-500 text-[11px] uppercase tracking-wider align-bottom">
                Specification
              </th>
              {compareItems.map(item => (
                <th key={item.id} className="p-5 min-w-[220px] align-top bg-white">
                  <div className="relative flex flex-col gap-3">
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 transition-all shadow-sm"
                      title="Remove from comparison"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className="relative w-full h-36 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <Image
                        src={getImg(item.id, item.images?.[0])}
                        alt={item.title}
                        fill
                        onError={() => setImgSrcs(prev => ({ ...prev, [item.id]: PLACEHOLDER_SVG }))}
                        className="object-contain p-3"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.brand}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-amber-400" />{item.rating}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-ink text-sm line-clamp-2 mb-2 leading-snug">{item.title}</h4>
                      <PriceTag price={item.basePrice} compareAtPrice={item.compareAtPrice} size="sm" />
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addToCart(item)}
                      className="w-full flex items-center justify-center gap-1.5 mt-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </Button>

                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="text-center text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      View Full Details →
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Comparison Rows */}
          <tbody className="divide-y divide-slate-100">
            {/* Condition row */}
            <tr className="bg-slate-50/30">
              <td className="p-4 font-bold text-slate-600 bg-slate-50 text-[11px] uppercase tracking-wide">Condition</td>
              {compareItems.map(item => (
                <td key={item.id} className="p-4">
                  <Badge variant={item.condition === 'NEW' ? 'success' : item.condition === 'REFURBISHED' ? 'brand' : 'warning'}>
                    {item.condition}
                  </Badge>
                </td>
              ))}
            </tr>

            {/* Merchant row */}
            <tr>
              <td className="p-4 font-bold text-slate-600 bg-slate-50 text-[11px] uppercase tracking-wide">Verified Shop</td>
              {compareItems.map(item => (
                <td key={item.id} className="p-4 font-semibold text-ink">
                  <span className="flex items-center gap-1 text-teal-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    {item.agentShopName}
                  </span>
                  <span className="text-[10px] text-ink-muted mt-0.5 block">{item.agentCity}</span>
                </td>
              ))}
            </tr>

            {/* Base Price row */}
            <tr className="bg-slate-50/30">
              <td className="p-4 font-bold text-slate-600 bg-slate-50 text-[11px] uppercase tracking-wide">Price</td>
              {compareItems.map(item => (
                <td key={item.id} className="p-4 font-extrabold text-teal-800 text-sm">
                  {formatPKR(item.basePrice)}
                </td>
              ))}
            </tr>

            {/* All Specs rows */}
            {allSpecKeys.map((specKey, idx) => {
              const values = compareItems.map(i => String(i.specs?.[specKey] ?? 'N/A'));
              const isDifferent = new Set(values).size > 1;
              return (
                <tr key={specKey} className={`${isDifferent ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-slate-50/20' : ''}`}>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/60 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span>{getSpecLabel(specKey)}</span>
                      {isDifferent && (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                          DIFF
                        </span>
                      )}
                    </div>
                  </td>
                  {compareItems.map(item => (
                    <td key={item.id} className={`p-4 font-semibold text-ink ${isDifferent ? 'text-amber-900' : ''}`}>
                      {String(item.specs?.[specKey] ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
