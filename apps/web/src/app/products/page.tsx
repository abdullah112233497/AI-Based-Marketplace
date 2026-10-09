'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SlidersHorizontal, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ProductSummary, CategorySpecSchema } from '@tech-marketplace/shared';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { FilterPanel } from '@/components/marketplace/FilterPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';

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
  const searchQuery = searchParams.get('search');

  // 1. Fetch Categories
  const { data: catRes } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['categories'],
    queryFn: () => apiFetch('/categories'),
  });

  // 2. Fetch Active Spec Schema if category selected
  const { data: specRes } = useQuery<{ success: boolean; data: CategorySpecSchema }>({
    queryKey: ['category-specs', selectedCategory],
    queryFn: () => apiFetch(`/categories/${selectedCategory}/specs`),
    enabled: !!selectedCategory,
  });

  // 3. Fetch Products matching active query params
  const { data: productsRes, isLoading } = useQuery<{
    success: boolean;
    data: ProductSummary[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['catalog-products', queryParams],
    queryFn: () => apiFetch('/products', { params: queryParams }),
  });

  const categories = catRes?.data || [];
  const activeSpecSchema = specRes?.data;
  const products = productsRes?.data || [];
  const meta = productsRes?.meta || { total: 0, page: 1, totalPages: 1 };

  // Category title display
  const categoryTitle = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name ||
      `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Devices`
    : 'All Technology Hardware';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* 1. Breadcrumbs & Header Controls */}
      <div className="space-y-4 pb-6 border-b border-neutral-200/80">
        <nav className="flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">{categoryTitle}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-medium text-neutral-900 tracking-tight">
              {categoryTitle}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Showing <span className="font-semibold text-neutral-900">{meta.total}</span> certified products from verified physical storefronts
              {searchQuery && (
                <span> matching &ldquo;<strong className="text-neutral-900">{searchQuery}</strong>&rdquo;</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter drawer trigger */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden px-3.5 py-2 rounded-full border border-neutral-200 text-xs font-medium flex items-center gap-2 bg-white text-neutral-800 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-md border border-neutral-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#FFBE00] text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#FFBE00] text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar Filter Panel */}
        <div className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} lg:col-span-1`}>
          <FilterPanel categories={categories} activeSpecSchema={activeSpecSchema} />
        </div>

        {/* Right Products List / Grid */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="w-1/2 h-3" />
                  <Skeleton className="w-3/4 h-4" />
                  <Skeleton className="w-1/3 h-4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No matching hardware found"
              description="Try adjusting your specification filters, price bounds, or clearing search criteria."
              actionLabel="Reset All Filters"
              actionHref="/products"
            />
          ) : (
            <StaggerContainer
              staggerDelay={60}
              duration={400}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {products.map((product, idx) => (
                <StaggerItem key={product.id} index={idx}>
                  <ProductCard product={product} viewMode={viewMode} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="pt-6 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-600">
              <span>
                Page <strong className="text-neutral-900">{meta.page}</strong> of{' '}
                <strong className="text-neutral-900">{meta.totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/products?${new URLSearchParams({
                    ...queryParams,
                    page: String(Math.max(1, meta.page - 1)),
                  }).toString()}`}
                  className={`px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-medium ${
                    meta.page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-neutral-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Previous
                </Link>
                <Link
                  href={`/products?${new URLSearchParams({
                    ...queryParams,
                    page: String(Math.min(meta.totalPages, meta.page + 1)),
                  }).toString()}`}
                  className={`px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-medium ${
                    meta.page >= meta.totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-neutral-50'
                  }`}
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-neutral-400">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
