'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, SlidersHorizontal, ShieldCheck, ShoppingCart, Star, Sparkles, Package } from 'lucide-react';
import { ProductSummary, ProductCondition } from '@tech-marketplace/shared';
import { Badge } from '../ui/Badge';
import { PriceTag } from '../ui/PriceTag';
import { useCart } from '@/lib/cart-context';
import { useCompare } from '@/lib/compare-context';

export interface ProductCardProps {
  product: ProductSummary;
  viewMode?: 'grid' | 'list';
}

// SVG placeholder as a data URI — renders a clean tech-themed icon
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Cg transform='translate(150,150)'%3E%3Crect x='10' y='0' width='80' height='100' rx='8' fill='%23cbd5e1'/%3E%3Crect x='20' y='8' width='60' height='70' rx='4' fill='%23e2e8f0'/%3E%3Ccircle cx='50' cy='90' r='5' fill='%23e2e8f0'/%3E%3C/g%3E%3C/svg%3E`;

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || PLACEHOLDER_SVG);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isLiked = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const conditionVariant =
    product.condition === ProductCondition.NEW
      ? 'success'
      : product.condition === ProductCondition.REFURBISHED
      ? 'brand'
      : 'warning';

  // Discount percentage
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.basePrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : 0;

  // Extract 2-3 key specs for quick pill display
  const keySpecs = Object.entries(product.specs || {})
    .filter(([k]) => ['ram_gb', 'storage_gb', 'cpu', 'battery_mah', 'gpu', 'pta_approved'].includes(k))
    .slice(0, 3)
    .map(([k, v]) => {
      if (k === 'ram_gb') return `${v}GB RAM`;
      if (k === 'storage_gb') return `${v}GB`;
      if (k === 'battery_mah') return `${v}mAh`;
      if (k === 'pta_approved' && v === 'Official PTA Approved') return 'Official PTA';
      return String(v);
    });

  if (viewMode === 'list') {
    return (
      <div className="luxury-card rounded-2xl p-5 flex flex-col sm:flex-row gap-6 group">
        {/* Product Image */}
        <div className="relative w-full sm:w-52 h-52 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 flex items-center justify-center">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            onError={() => setImgSrc(PLACEHOLDER_SVG)}
            onLoad={() => setImgLoaded(true)}
            className={`object-contain p-3 transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />
          {!imgLoaded && <div className="absolute inset-0 img-placeholder rounded-xl" />}
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={conditionVariant} size="sm" className="shadow-xs backdrop-blur-md">
              {product.condition}
            </Badge>
          </div>
          {discountPercent > 0 && (
            <div className="absolute bottom-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-ink-muted">
              <span className="font-bold text-slate-700 tracking-wide uppercase text-[10px]">{product.brand}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                {product.agentShopName} ({product.agentCity})
              </span>
            </div>

            <Link href={`/products/${product.slug || product.id}`}>
              <h3 className="font-extrabold text-ink text-base hover:text-brand transition-colors line-clamp-2 mb-2 leading-snug">
                {product.title}
              </h3>
            </Link>

            <p className="text-xs text-ink-muted line-clamp-2 mb-3 leading-relaxed">
              {product.description}
            </p>

            {/* Key Specs Pills */}
            {keySpecs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {keySpecs.map((spec, idx) => (
                  <span key={idx} className="text-[11px] font-semibold bg-slate-100/80 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <PriceTag price={product.basePrice} compareAtPrice={product.compareAtPrice} size="lg" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => isCompared ? removeFromCompare(product.id) : addToCompare(product)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCompared ? 'bg-teal-700 text-white border-teal-700' : 'border-border text-slate-600 hover:bg-slate-50'
                }`}
                title="Compare Specifications"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isCompared ? 'In Compare' : 'Compare'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  isLiked ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-border text-slate-600 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
              </button>

              <button
                onClick={() => addToCart(product)}
                className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid Card View (Default)
  return (
    <div className="luxury-card rounded-2xl p-4 flex flex-col justify-between group relative">
      {/* Top Image & Floating Badges */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 mb-3.5 border border-slate-100/80 flex items-center justify-center">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          onError={() => setImgSrc(PLACEHOLDER_SVG)}
          onLoad={() => setImgLoaded(true)}
          className={`object-contain p-3.5 transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!imgLoaded && <div className="absolute inset-0 img-placeholder rounded-xl" />}

        {/* Condition Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge variant={conditionVariant} size="sm" className="shadow-xs backdrop-blur-md">
            {product.condition}
          </Badge>
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm badge-premium">
            -{discountPercent}% OFF
          </div>
        )}

        {/* Action icons over image */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 ${
              isLiked ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              isCompared ? removeFromCompare(product.id) : addToCompare(product);
            }}
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 ${
              isCompared ? 'bg-teal-700 text-white ring-1 ring-teal-500' : 'bg-white/90 text-slate-600 hover:bg-white hover:text-brand'
            }`}
            title="Compare Specs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Vendor & Rating */}
        <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1.5">
          <span className="flex items-center gap-1 truncate text-teal-800 font-semibold max-w-[65%]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{product.agentShopName}</span>
          </span>
          <span className="flex items-center gap-1 text-amber-500 font-extrabold shrink-0 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
            <Star className="w-3 h-3 fill-amber-400" />
            {product.rating}
          </span>
        </div>

        {/* Product Title */}
        <Link href={`/products/${product.slug || product.id}`}>
          <h3 className="font-extrabold text-ink text-sm hover:text-brand transition-colors line-clamp-2 mb-2 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Key Specs Pills */}
        {keySpecs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3.5">
            {keySpecs.map((spec, idx) => (
              <span key={idx} className="text-[10px] font-semibold bg-slate-100/90 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/50">
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price & Add to Cart button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <PriceTag price={product.basePrice} compareAtPrice={product.compareAtPrice} size="sm" />

        <button
          onClick={() => addToCart(product)}
          className="p-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          title="Add to Shopping Cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
