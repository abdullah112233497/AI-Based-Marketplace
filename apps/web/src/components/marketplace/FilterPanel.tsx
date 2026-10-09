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
    <div className="pt-4 pb-1 border-t border-neutral-100">
      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">
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
  const filterableFields =
    activeSpecSchema?.fields.filter((f) => f.filterable && f.options && f.options.length > 0) || [];

  return (
    <div className={`bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-900" />
          <span>Refine Hardware</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-1">
        {/* Sort */}
        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
            Sort Order
          </label>
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 appearance-none transition-all"
            >
              <option value="newest">Newest Certified Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Verified Rating</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <FilterSection title="Device Category">
          <div className="space-y-1">
            <button
              onClick={() => updateParam('category', null)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !selectedCategory
                  ? 'bg-[#FFBE00] text-neutral-900 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateParam('category', cat.slug)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#FFBE00] text-neutral-900 font-bold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection title="Hardware Condition">
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: '', label: 'All' },
              { value: ProductCondition.NEW, label: 'New Sealed' },
              { value: ProductCondition.USED, label: 'Used Inspected' },
              { value: ProductCondition.REFURBISHED, label: 'Refurbished' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateParam('condition', value || null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedCondition === value
                    ? 'bg-[#FFBE00] text-neutral-900 border-[#FFBE00] font-bold shadow-xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
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
              className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white"
            />
            <span className="text-neutral-400 text-xs shrink-0">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value || null)}
              className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white"
            />
          </div>
          {/* Quick Price Presets */}
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: '< 50K', min: '', max: '50000' },
              { label: '50K - 150K', min: '50000', max: '150000' },
              { label: '150K+', min: '150000', max: '' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  updateParam('minPrice', preset.min || null);
                  updateParam('maxPrice', preset.max || null);
                }}
                className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Dynamic Spec Schema Facets (RAM, Storage, PTA, etc.) */}
        {filterableFields.map((field) => {
          const currentValue = searchParams.get(field.key) || '';
          return (
            <FilterSection key={field.key} title={`${field.label}${field.unit ? ` (${field.unit})` : ''}`}>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateParam(field.key, null)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    !currentValue
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  All
                </button>
                {field.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updateParam(field.key, opt === currentValue ? null : opt)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      currentValue === opt
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
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
