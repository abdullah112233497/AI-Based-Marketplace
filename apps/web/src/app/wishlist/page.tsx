'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { formatPKR } from '@/lib/utils';

interface WishlistItemData {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    basePrice: number;
    compareAtPrice?: number;
    images?: string[];
    condition: string;
    stock: number;
    agentShopName?: string;
    agentCity?: string;
  };
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; data: WishlistItemData[] }>('/wishlist');
      if (res?.data) {
        setItems(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.productId !== productId));
      toggleWishlist(productId);
    } catch (err: any) {
      alert(err.message || 'Failed to remove product from wishlist');
    }
  };

  const handleMoveToCart = async (item: WishlistItemData) => {
    addToCart(item.product as any, 1);
    await handleRemove(item.productId);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2.5">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              Saved Tech Wishlist
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your saved laptops, smartphones, GPUs, and peripherals with real-time stock and price updates.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Wishlist Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading your saved items...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-ink">Your wishlist is currently empty</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore thousands of verified genuine tech products, click the heart icon on any product, and keep track of deals here.
            </p>
            <Link href="/products" className="inline-block pt-2">
              <Button variant="primary" size="md">
                Browse Marketplace Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const p = item.product;
              const isOutOfStock = p.stock <= 0;
              const imageSrc = p.images && p.images.length > 0 ? p.images[0] : '/placeholder-tech.png';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={imageSrc}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                        {p.condition}
                      </span>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-2.5">
                      {p.agentShopName && (
                        <p className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          {p.agentShopName} {p.agentCity ? `(${p.agentCity})` : ''}
                        </p>
                      )}

                      <Link href={`/products/${p.slug}`} className="block">
                        <h3 className="font-bold text-xs text-ink line-clamp-2 hover:text-teal-700 transition-colors">
                          {p.title}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-ink">{formatPKR(p.basePrice)}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatPKR(p.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            In Stock ({p.stock} units)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMoveToCart(item)}
                      disabled={isOutOfStock}
                      className="flex-1 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </Button>
                    <Link
                      href={`/products/${p.slug}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white hover:text-ink transition-colors"
                      title="View product specifications"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
