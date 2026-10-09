'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart, ArrowLeft, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ProductSummary } from '@tech-marketplace/shared';
import { useCart } from '@/lib/cart-context';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  // Fetch all products from catalog
  const { data: productsRes, isLoading } = useQuery<{
    success: boolean;
    data: ProductSummary[];
  }>({
    queryKey: ['wishlist-all-products'],
    queryFn: () => apiFetch('/products', { params: { limit: 100 } }),
  });

  const allProducts = productsRes?.data || [];
  // Filter products strictly matching wishlisted product IDs
  const wishlistedProducts = allProducts.filter((product) => wishlist.includes(product.id));

  const handleClearAll = () => {
    wishlist.forEach((id) => toggleWishlist(id));
  };

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach((product) => {
      addToCart(product, 1);
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Wishlist</span>
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 mb-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>Personal Saved Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              My Saved Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Keep track of verified hardware, compare prices from physical tech hubs, and order when you are ready.
            </p>
          </div>

          {/* Quick Header Actions */}
          {!isLoading && wishlistedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddAllToCart}
                className="inline-flex items-center gap-2 bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Move All to Cart</span>
              </button>

              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                <Skeleton className="w-full h-48 rounded-lg" />
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
                <Skeleton className="w-full h-10 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Empty Wishlist State */}
        {!isLoading && wishlistedProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center max-w-2xl mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Heart className="w-8 h-8 fill-red-200 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Your Wishlist is Currently Empty
            </h2>
            <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto leading-relaxed">
              You haven&apos;t added any items to your wishlist yet. Explore our verified marketplace catalog and tap the heart icon on any card to save it here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-6 py-3 rounded-lg shadow-xs transition-transform active:scale-95"
              >
                <span>Browse All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs px-5 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Link>
            </div>
          </div>
        )}

        {/* Wishlisted Products Grid */}
        {!isLoading && wishlistedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-neutral-600 font-semibold">
                Showing {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'saved product' : 'saved products'}
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#0070F3] hover:underline flex items-center gap-1"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistedProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Bottom Verification Guarantee */}
            <div className="mt-12 bg-white rounded-xl border border-neutral-200/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600 shadow-2xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-neutral-900 shrink-0" />
                <span>
                  <strong>Physical Verification Guarantee:</strong> All items in your wishlist are audited by authorized vendors in Hafeez Centre & Techno City.
                </span>
              </div>
              <Link
                href="/agents"
                className="text-[#0070F3] font-bold hover:underline shrink-0"
              >
                View Hub Locations →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
