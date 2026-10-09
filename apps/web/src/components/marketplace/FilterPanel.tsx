'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { ProductCondition, CategorySpecSchema } from '@tech-marketplace/shared';

interface FilterPanelProps {
  categories: { id: string; name: string; slug: string }[];
  activeSpecSchema?: CategorySpecSchema;
  className?: string;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 border-t border-slate-100">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
        {title}
      </label>
      {children}
    </div>
  );
}

export function FilterPanel({ categories, activeSpecSchema, className = '' }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedCondition = searchParams.get('condition') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = selectedCategory || selectedCondition || selectedBrand || minPrice || maxPrice;

  // Filterable schema fields
  const filterableFields = activeSpecSchema?.fields.filter(f => f.filterable && f.options && f.options.length > 0) || [];

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-xs overflow-hidden ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <h3 className="font-extrabold text-sm text-ink flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand" />
          Refine Search
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-brand hover:text-teal-900 font-bold flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-all hover:bg-teal-100"
          >
            <RotateCcw className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="p-5 space-y-0">
        {/* Sort */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Sort By
          </label>
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-teal-500/30 appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <FilterSection title="Category">
          <div className="space-y-1">
            <button
              onClick={() => updateParam('category', null)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => updateParam('category', cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection title="Condition">
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: '', label: 'All' },
              { value: ProductCondition.NEW, label: 'New' },
              { value: ProductCondition.USED, label: 'Used' },
              { value: ProductCondition.REFURBISHED, label: 'Refurb' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateParam('condition', value || null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedCondition === value
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range (PKR)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => updateParam('minPrice', e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <span className="text-slate-400 text-xs shrink-0">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          {/* Quick Price Presets */}
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: '<50K', min: '', max: '50000' },
              { label: '50-150K', min: '50000', max: '150000' },
              { label: '150K+', min: '150000', max: '' },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  updateParam('minPrice', preset.min || null);
                  updateParam('maxPrice', preset.max || null);
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Dynamic Spec Schema Facets (RAM, Storage, PTA, etc.) */}
        {filterableFields.map(field => {
          const currentValue = searchParams.get(field.key) || '';
          return (
            <FilterSection key={field.key} title={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateParam(field.key, null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    !currentValue
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {field.options?.map(opt => (
                  <button
                    key={opt}
                    onClick={() => updateParam(field.key, opt === currentValue ? null : opt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      currentValue === opt
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt} {field.unit || ''}
                  </button>
                ))}
              </div>
            </FilterSection>
          );
        })}
      </div>
    </div>
  );
}
