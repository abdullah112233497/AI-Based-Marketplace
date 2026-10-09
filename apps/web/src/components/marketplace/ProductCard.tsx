'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, SlidersHorizontal, ShoppingCart, Star, ShieldCheck } from 'lucide-react';
import { ProductSummary, ProductCondition } from '@tech-marketplace/shared';
import { useCart } from '@/lib/cart-context';
import { useCompare } from '@/lib/compare-context';

export interface ProductCardProps {
  product: ProductSummary;
  viewMode?: 'grid' | 'list';
}

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23fafafa' width='400' height='400'/%3E%3Cg transform='translate(150,150)'%3E%3Crect x='10' y='0' width='80' height='100' rx='8' fill='%23e5e7eb'/%3E%3Crect x='20' y='8' width='60' height='70' rx='4' fill='%23f3f4f6'/%3E%3Ccircle cx='50' cy='90' r='5' fill='%23e5e7eb'/%3E%3C/g%3E%3C/svg%3E`;

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || PLACEHOLDER_SVG);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isLiked = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  // Format Pakistani Rupees
  const formatPrice = (amount: number) => `Rs ${amount.toLocaleString()}`;

  // Discount percentage if compareAtPrice is higher
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  // List View Mode
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-lg border border-neutral-200 p-5 flex flex-col sm:flex-row gap-6 hover:border-[#FFBE00] hover:shadow-md transition-all duration-300">
        {/* Product Image Stage */}
        <div className="relative w-full sm:w-56 h-52 rounded-md bg-neutral-50 shrink-0 flex items-center justify-center overflow-hidden border border-neutral-100">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, 224px"
            onError={() => setImgSrc(PLACEHOLDER_SVG)}
            onLoad={() => setImgLoaded(true)}
            className={`object-contain p-4 transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!imgLoaded && <div className="absolute inset-0 bg-neutral-100 animate-pulse" />}

          {hasDiscount && (
            <div className="absolute top-2.5 left-2.5 bg-[#DF2020] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Category / Brand Eyebrow */}
            <div className="flex items-center gap-2 mb-1.5 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]">
                {product.categoryName || product.brand}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-neutral-600">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                <span>{product.agentShopName}</span>
                <span>({product.agentCity})</span>
              </span>
            </div>

            {/* Title */}
            <Link href={`/products/${product.slug || product.id}`}>
              <h3 className="font-bold text-neutral-900 text-base hover:text-[#0070F3] transition-colors line-clamp-2 leading-snug mb-2">
                {product.title}
              </h3>
            </Link>

            {/* 5-Star Rating */}
            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-[#FFBE00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#FFBE00] text-[#FFBE00]" />
                ))}
              </div>
              <span className="text-xs text-neutral-500 font-medium ml-1">
                ({product.rating.toFixed(1)})
              </span>
            </div>

            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing & Yellow Add-to-Cart Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100 mt-4">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(product.basePrice)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => (isCompared ? removeFromCompare(product.id) : addToCompare(product))}
                className={`p-2 rounded border text-xs font-medium transition-colors ${
                  isCompared
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
                title="Compare Specifications"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded border text-xs transition-colors ${
                  isLiked
                    ? 'bg-[#DF2020] border-[#DF2020] text-white'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => addToCart(product)}
                className="px-6 py-2 rounded bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add To Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Grid View Mode (Directly inspired by Onetech's "Shop By New Products" & "Featured Products")
  return (
    <div className="group bg-white rounded-lg border border-neutral-200/90 p-4 flex flex-col justify-between hover:border-[#FFBE00] hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 ease-out relative">
      <div>
        {/* Wishlist & Compare Icons (Top Right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-110 active:scale-90 shadow-2xs ${
              isLiked
                ? 'bg-[#DF2020] border-[#DF2020] text-white'
                : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:border-neutral-300'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              isCompared ? removeFromCompare(product.id) : addToCompare(product);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-110 active:scale-90 shadow-2xs ${
              isCompared
                ? 'bg-neutral-900 border-neutral-900 text-white'
                : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:border-neutral-300'
            }`}
            title="Compare"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Product Image Stage */}
        <div className="relative w-full aspect-square rounded-md bg-white mb-3 flex items-center justify-center overflow-hidden">
          <Link
            href={`/products/${product.slug || product.id}`}
            className="absolute inset-0 flex items-center justify-center p-4 z-0"
          >
            <Image
              src={imgSrc}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImgSrc(PLACEHOLDER_SVG)}
              onLoad={() => setImgLoaded(true)}
              className={`object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-108 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!imgLoaded && <div className="absolute inset-0 bg-neutral-100 animate-pulse" />}
          </Link>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10 bg-[#DF2020] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs transition-transform duration-300 group-hover:scale-105">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Category Tag */}
        <div className="text-[11px] text-neutral-400 font-medium mb-1 tracking-wide">
          {product.categoryName || product.brand}
        </div>

        {/* Product Title (Blue Hover) */}
        <Link href={`/products/${product.slug || product.id}`}>
          <h3 className="font-semibold text-neutral-900 text-sm hover:text-[#0070F3] transition-colors duration-200 line-clamp-2 leading-snug mb-2">
            {product.title}
          </h3>
        </Link>

        {/* 5-Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-[#FFBE00]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-[#FFBE00] text-[#FFBE00] transition-transform duration-200 hover:scale-125" />
            ))}
          </div>
          <span className="text-[11px] text-neutral-400 ml-1">
            ({product.rating.toFixed(1)})
          </span>
        </div>
      </div>

      {/* Pricing & Onetech Yellow Button */}
      <div className="pt-2 border-t border-neutral-100 space-y-3 mt-auto">
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
          <span className="text-base font-bold text-neutral-900">
            {formatPrice(product.basePrice)}
          </span>
        </div>

        {/* Iconic Onetech Yellow "Add To Cart" Button */}
        <button
          onClick={() => addToCart(product)}
          className="w-full py-2 bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs rounded transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs hover:shadow active:scale-[0.97]"
        >
          <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add To Cart</span>
        </button>
      </div>
    </div>
  );
}
