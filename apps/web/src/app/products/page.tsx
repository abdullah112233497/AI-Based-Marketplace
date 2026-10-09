'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ProductSummary, CategorySpecSchema } from '@tech-marketplace/shared';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { FilterPanel } from '@/components/marketplace/FilterPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

function CatalogContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Convert search params to object for query
  const queryParams: Record<string, any> = {};
  searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const selectedCategory = searchParams.get('category');

  // 1. Fetch Categories
  const { data: catRes } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['categories'],
    queryFn: () => apiFetch('/categories')
  });

  // 2. Fetch Active Spec Schema if category selected
  const { data: specRes } = useQuery<{ success: boolean; data: CategorySpecSchema }>({
    queryKey: ['category-specs', selectedCategory],
    queryFn: () => apiFetch(`/categories/${selectedCategory}/specs`),
    enabled: !!selectedCategory
  });

  // 3. Fetch Products matching active query params
  const { data: productsRes, isLoading } = useQuery<{
    success: boolean;
    data: ProductSummary[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['catalog-products', queryParams],
    queryFn: () => apiFetch('/products', { params: queryParams })
  });

  const categories = catRes?.data || [];
  const activeSpecSchema = specRes?.data;
  const products = productsRes?.data || [];
  const meta = productsRes?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header & Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            {selectedCategory ? `${selectedCategory.toUpperCase()} Devices` : 'All Tech Products'}
          </h1>
          <p className="text-xs text-ink-muted">
            Showing <span className="font-bold text-ink">{meta.total}</span> verified products with authentic specs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden px-3 py-2 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 bg-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
            <span>Filters</span>
          </button>

          {/* Grid / List View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-brand' : 'text-slate-500 hover:text-ink'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-xs text-brand' : 'text-slate-500 hover:text-ink'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar Filter Panel */}
        <div className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} lg:col-span-1`}>
          <FilterPanel categories={categories} activeSpecSchema={activeSpecSchema} />
        </div>

        {/* Right Products List / Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-card border border-border p-4 space-y-3">
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <Skeleton className="w-3/4 h-5" />
                  <Skeleton className="w-1/2 h-4" />
                  <Skeleton className="w-full h-9" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No matching products found"
              description="Try adjusting or clearing your spec filters to discover more items."
              actionLabel="Clear Filters"
              actionHref="/products"
            />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading Catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
