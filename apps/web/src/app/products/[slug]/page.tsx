'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Store,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  Check,
  MessageSquare,
  ChevronRight,
  Info
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ProductSummary, ProductCondition } from '@tech-marketplace/shared';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SpecTable } from '@/components/marketplace/SpecTable';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCart } from '@/lib/cart-context';
import { useCompare } from '@/lib/compare-context';
import { formatPKR, formatDate } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'vendor' | 'reviews' | 'shipping'>('specs');
  const [copiedLink, setCopiedLink] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // City Delivery Calculator
  const [selectedCity, setSelectedCity] = useState('Islamabad');

  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const { data: res, isLoading } = useQuery<{
    success: boolean;
    data: ProductSummary & { category: any; agent: any; related: ProductSummary[]; reviews: any[] };
  }>({
    queryKey: ['product-detail', slug],
    queryFn: () => apiFetch(`/products/${slug}`),
    enabled: !!slug
  });

  const product = res?.data;

  // Add Review Mutation
  const reviewMutation = useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      apiFetch(`/products/${product?.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      alert('Thank you! Your verified review has been published.');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['product-detail', slug] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to submit review.');
    }
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to leave a review.');
      return;
    }
    if (!reviewComment.trim()) return;
    reviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="w-full h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/2 h-6" />
            <Skeleton className="w-full h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-ink mb-2">Product Not Found</h2>
        <p className="text-sm text-ink-muted mb-6">The requested product could not be located in our catalog.</p>
        <Link href="/products">
          <Button variant="primary">Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  const isLiked = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const reviews = product.reviews || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      
      {/* Breadcrumbs & Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-ink-muted pb-2 border-b border-slate-100">
        <nav className="flex items-center gap-2">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category?.slug || 'all'}`} className="hover:text-brand">
            {product.category?.name || 'Catalog'}
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold truncate max-w-xs sm:max-w-md">{product.title}</span>
        </nav>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-brand hover:bg-slate-50 transition-colors"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Link Copied!' : 'Share Device'}</span>
        </button>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full h-96 sm:h-[480px] bg-white rounded-3xl border border-border overflow-hidden p-6 flex items-center justify-center shadow-xs">
            <Image
              src={product.images[selectedImageIdx] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'}
              alt={product.title}
              fill
              priority
              className="object-contain p-4 transition-all duration-300"
            />
            <div className="absolute top-4 left-4">
              <Badge variant={product.condition === ProductCondition.NEW ? 'success' : product.condition === ProductCondition.REFURBISHED ? 'brand' : 'warning'}>
                {product.condition} Condition
              </Badge>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl border-2 bg-white overflow-hidden shrink-0 transition-all ${
                    selectedImageIdx === idx ? 'border-brand shadow-md scale-105' : 'border-slate-200 hover:border-slate-400 opacity-70'
                  }`}
                >
                  <Image src={img} alt="Thumbnail" fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy Box & Highlights */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Verified Hardware Guarantee
              </span>
              <span className="text-xs text-ink-muted">• Brand: <strong>{product.brand}</strong></span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mb-3 leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-ink-muted">
              <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal">({reviews.length || product.reviewCount} customer reviews)</span>
              </div>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} units)
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-teal-50/40 border border-slate-200 space-y-2">
            <PriceTag price={product.basePrice} compareAtPrice={product.compareAtPrice} size="xl" />
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-teal-800 pt-1 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Earn {formatPKR(Math.floor(product.basePrice * 0.02))} wallet cashback
              </span>
              <span>•</span>
              <span>Cash on Delivery available</span>
            </div>
          </div>

          {/* Physical Verified Merchant Card */}
          <div className="p-4 rounded-2xl border border-teal-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-ink font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  {product.agentShopName}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  <MapPin className="w-3 h-3 inline text-slate-400 mr-0.5" />
                  {product.agentCity} Verified Physical Merchant
                </p>
              </div>
            </div>

            <Link
              href={`/agents/${product.agent?.shopSlug || product.agentId}`}
              className="px-3.5 py-1.5 rounded-xl border border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-center transition-colors"
            >
              View Shop & Ratings
            </Link>
          </div>

          {/* Delivery Estimator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-700" />
              <span className="text-slate-600">Ship to:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-ink"
              >
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Faisalabad">Faisalabad</option>
              </select>
            </div>
            <span className="text-teal-800 font-bold">
              {selectedCity === product.agentCity ? 'Same-Day / 24 Hours' : '24-48 Hours Express'}
            </span>
          </div>

          {/* Action Buttons: Add to Cart, Stepper, Compare */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2.5 text-xs font-bold text-ink min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  addToCart(product, quantity);
                  alert(`Added ${quantity} × ${product.title} to shopping cart!`);
                }}
                className="flex-1 flex items-center justify-center gap-2 shadow-md shadow-teal-900/20"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add {quantity} to Cart</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => isCompared ? removeFromCompare(product.id) : addToCompare(product)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isCompared ? 'bg-brand text-white border-brand' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isCompared ? 'In Compare Matrix' : 'Compare Specs'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isLiked ? 'bg-rose-50 border-rose-300 text-rose-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                <span>{isLiked ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs: Specifications, Vendor Verification, Reviews, Warranty */}
      <div className="pt-6 border-t border-border space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-1 overflow-x-auto text-xs font-bold">
          {[
            { key: 'specs', label: 'Verified Technical Specs', count: Object.keys(product.specs || {}).length },
            { key: 'reviews', label: 'Customer Reviews & Feedback', count: reviews.length },
            { key: 'vendor', label: 'Merchant & Verification Guarantee' },
            { key: 'shipping', label: 'Nationwide Delivery & Returns' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-teal-900 text-teal-200' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: SPECIFICATIONS */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-ink">Structured Hardware Specifications</h3>
            <SpecTable schema={product.category?.specSchema} specs={product.specs} />
          </div>
        )}

        {/* TAB 2: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-extrabold text-base text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                Verified Buyer Reviews ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-ink-muted italic py-6">No customer reviews yet. Be the first verified buyer to review!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                            {rev.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-ink">{rev.userName}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold ml-2">✓ Verified Purchase</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-ink-muted">{formatDate(rev.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Box */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4 h-fit">
              <h4 className="font-bold text-sm text-ink">Write a Verified Review</h4>
              <p className="text-xs text-ink-muted">Share your hands-on feedback on speed, build quality, and authenticity.</p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-ink ml-2">{reviewRating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Review Comments</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe PTA status verification, packaging condition, performance..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="md" isLoading={isSubmittingReview} className="w-full">
                  Post Verified Review
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: VENDOR VERIFICATION */}
        {activeTab === 'vendor' && (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-extrabold text-base text-ink">Physical Shop Inspection Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every merchant listed on Tech Marketplace undergoes strict on-site verification at their physical storefront (Hafeez Centre Lahore, Techno City Karachi, Beverly Centre Islamabad, Saddar Rawalpindi).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <span className="font-bold text-teal-900 block">✓ IMEI / Serial Check</span>
                <span className="text-teal-800">PTA registration status and original manufacturer serials are validated.</span>
              </div>
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <span className="font-bold text-teal-900 block">✓ 7-Day Checking Warranty</span>
                <span className="text-teal-800">Full replacement or refund if any technical discrepancy is discovered.</span>
              </div>
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <span className="font-bold text-teal-900 block">✓ Insured Courier Handover</span>
                <span className="text-teal-800">Packaged with tamper-evident security tape before dispatch.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SHIPPING & RETURNS */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="font-extrabold text-base text-ink">Nationwide Shipping Rates & Delivery Timeframes</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Major Cities (Karachi, Lahore, Islamabad/Rawalpindi):</strong> 24 to 48 hours delivery via TCS Express / Leopard Courier.</li>
              <li><strong>Other Cities & Towns:</strong> 2 to 3 business days with active live SMS tracking.</li>
              <li><strong>Cash on Delivery:</strong> Available for orders up to Rs. 200,000 across Pakistan.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Related Hardware Recommendations */}
      {product.related && product.related.length > 0 && (
        <section className="pt-8 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-ink tracking-tight">
              Recommended Tech in {product.category?.name || 'Category'}
            </h2>
            <Link href={`/products?category=${product.category?.slug}`} className="text-xs font-bold text-teal-700 hover:underline">
              View All Category Listings
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.related.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom Add-to-Cart Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <p className="text-[10px] text-ink-muted truncate max-w-[150px]">{product.title}</p>
          <p className="text-sm font-black text-teal-800">{formatPKR(product.basePrice)}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            addToCart(product, quantity);
            alert(`Added ${quantity} × ${product.title} to cart!`);
          }}
          className="flex items-center gap-1.5"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </Button>
      </div>

    </div>
  );
}
