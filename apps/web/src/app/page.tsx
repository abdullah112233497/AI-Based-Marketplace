'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Gift,
  ArrowRight,
  Star,
  Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ProductSummary, AgentSummary } from '@tech-marketplace/shared';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { HeroSection } from '@/components/marketplace/HeroSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { Skeleton } from '@/components/ui/Skeleton';

// 8 Onetech Hardware Categories from reference image
const ONETECH_CATEGORIES = [
  {
    name: 'Cooling System',
    href: '/products?search=Cooling',
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300&q=80',
  },
  {
    name: 'Processor',
    href: '/products?search=Intel',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&q=80',
  },
  {
    name: 'Mother Board',
    href: '/products?search=Motherboard',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
  },
  {
    name: 'Memory (RAM)',
    href: '/products?search=RAM',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&q=80',
  },
  {
    name: 'Storage (SSD)',
    href: '/products?search=SSD',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&q=80',
  },
  {
    name: 'Graphics Card',
    href: '/products?search=RTX',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&q=80',
  },
  {
    name: 'Power Supply',
    href: '/products?search=Power',
    image: 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=300&q=80',
  },
  {
    name: 'Cabinet (Case)',
    href: '/products?search=Case',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&q=80',
  },
];

// Customer Testimonials from Reference
const CUSTOMER_REVIEWS = [
  {
    quote:
      'I recently purchased a high-end RTX gaming rig from Hafeez Centre through this platform. The pricing was fair, physical shop warranty was verified, and delivery took under 24 hours.',
    author: 'Hamza Malik',
    role: 'Gaming Creator, Lahore',
  },
  {
    quote:
      'As a software architect, I always look for top-tier hardware. Sourcing verified M3 Max and Dell XPS directly from Techno City with serial tracking has saved our team countless hours.',
    author: 'Daniyal Qureshi',
    role: 'Engineering Lead, Karachi',
  },
  {
    quote:
      'The IMEI verification and physical store invoices give complete peace of mind. Both phones and peripherals arrived factory sealed with genuine PTA clearance.',
    author: 'Zainab Tariq',
    role: 'Enterprise Buyer, Islamabad',
  },
];

export default function HomePage() {
  // Live Countdown Timer for "Deals Of The Week"
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 36, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 3, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Products (Newest 12 for Bento, Featured, and New Products sections)
  const { data: productsRes, isLoading: loadingProducts } = useQuery<{
    success: boolean;
    data: ProductSummary[];
  }>({
    queryKey: ['home-products'],
    queryFn: () => apiFetch('/products?limit=12&sort=newest'),
  });

  // Fetch Physical Hub Stores
  const { data: agentsRes } = useQuery<{
    success: boolean;
    data: AgentSummary[];
  }>({
    queryKey: ['home-agents'],
    queryFn: () => apiFetch('/agent/directory'),
  });

  const products = productsRes?.data || [];
  const agents = agentsRes?.data || [];

  const featuredCompact = products.slice(0, 6);
  const shopByNew = products.slice(0, 4);
  const weeklyDeals = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.basePrice).slice(0, 2);

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 bg-white">
      
      {/* 1. Bento Hero Section with Timed Sequence Entrance */}
      <HeroSection />

      {/* 2. 5-Column Trust Bar (Scroll-Revealed) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16} duration={500}>
          <div className="border border-neutral-200 rounded-xl p-5 sm:p-6 bg-white shadow-2xs">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
              
              <div className="flex items-center gap-3 pt-3 md:pt-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#FFBE00]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900">Easy Free Delivery</h5>
                  <p className="text-[11px] text-neutral-400">Order On Rs 5,000*</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#FFBE00]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900">Premium Warranty</h5>
                  <p className="text-[11px] text-neutral-400">Up To 2 Years</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-[#FFBE00]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900">Easy Free Return</h5>
                  <p className="text-[11px] text-neutral-400">7-Day Inspection</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-[#FFBE00]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900">24/7 Online Support</h5>
                  <p className="text-[11px] text-neutral-400">Physical Hub Assistance</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:pl-4 pt-3 md:pt-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-[#FFBE00]" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900">Best Special Gifts</h5>
                  <p className="text-[11px] text-neutral-400">On First Order</p>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. "Shop By Categories" Section (Staggered Animation Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16} duration={450}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Shop By Categories
            </h2>

            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded bg-[#FFBE00] flex items-center justify-center text-neutral-900 font-bold transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <StaggerContainer staggerDelay={60} duration={400} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {ONETECH_CATEGORIES.map((cat, idx) => (
            <StaggerItem key={cat.name} index={idx}>
              <Link
                href={cat.href}
                className={`group p-4 rounded-lg flex items-center gap-4 transition-all duration-300 ${
                  idx === 0
                    ? 'border border-neutral-300 shadow-xs bg-white hover:border-[#FFBE00] hover:shadow-md'
                    : 'hover:bg-neutral-50 hover:shadow-xs border border-transparent hover:border-neutral-200'
                }`}
              >
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-xs text-neutral-900 group-hover:text-[#0070F3] transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-medium hover:underline">
                    View More
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 4. Dual Promotional Dark Banners (Split Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Banner 1: Refurbished Computer System (Slide In Left) */}
          <ScrollReveal direction="left" distance={24} duration={600}>
            <div className="relative rounded-2xl overflow-hidden min-h-[220px] p-8 flex flex-col justify-center bg-neutral-900 group shadow-xs">
              <Image
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80"
                alt="Refurbished Gaming Setup"
                fill
                className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="relative z-10 space-y-3 max-w-xs text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  Get Your <span className="text-[#00BCD4]">Refurbished Computer</span> <br />
                  System At Valid Price
                </h3>
                <Link
                  href="/products?condition=REFURBISHED"
                  className="inline-block border border-white text-white font-medium text-xs px-5 py-2 rounded hover:bg-white hover:text-neutral-900 transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Banner 2: New Computer System (Slide In Right) */}
          <ScrollReveal direction="right" distance={24} duration={600}>
            <div className="relative rounded-2xl overflow-hidden min-h-[220px] p-8 flex flex-col justify-center bg-neutral-900 group shadow-xs">
              <Image
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&q=80"
                alt="New Computer Setup"
                fill
                className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="relative z-10 space-y-3 max-w-xs text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  Get Your <span className="text-[#FFBE00]">New Computer</span> System <br />
                  At 15% Discount
                </h3>
                <Link
                  href="/products?condition=NEW"
                  className="inline-block border border-white text-white font-medium text-xs px-5 py-2 rounded hover:bg-white hover:text-neutral-900 transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 5. "Featured Products" Section & Compact Cards (Staggered Grid Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16} duration={450}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-neutral-600 hover:text-[#0070F3] flex items-center gap-1 group"
            >
              <span>See All Products</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-full h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <StaggerContainer staggerDelay={70} duration={450} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCompact.map((p, idx) => (
              <StaggerItem key={p.id} index={idx}>
                <div
                  className="bg-white border border-neutral-200 rounded-lg p-4 flex items-center gap-4 hover:border-[#FFBE00] hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative w-20 h-20 shrink-0 bg-neutral-50 rounded flex items-center justify-center overflow-hidden">
                    <Image
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&q=80'}
                      alt={p.title}
                      fill
                      className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex-1 space-y-1 text-left">
                    <Link href={`/products/${p.slug || p.id}`}>
                      <h4 className="font-semibold text-xs text-neutral-900 hover:text-[#0070F3] line-clamp-1 transition-colors">
                        {p.title}
                      </h4>
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-neutral-900">
                        Rs {p.basePrice.toLocaleString()}
                      </span>
                      {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          Rs {p.compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/products/${p.slug || p.id}`}
                      className="inline-block bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-[10px] px-3 py-1 rounded transition-colors shadow-2xs hover:shadow-xs"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* 6. Full-Width Dark Graphics Card Promotional Banner (Cinematic Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={20} duration={600}>
          <div className="bg-[#14171F] rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-md">
            <div className="space-y-3 max-w-md z-10 text-center md:text-left">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold tracking-wider">
                Recently Launched Graphics Card
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Get Your New <span className="text-[#FFBE00]">High Processing</span> <br />
                Gaming Graphics Card
              </h3>
              <div className="pt-2">
                <Link
                  href="/products?search=RTX"
                  className="inline-block bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-6 py-2.5 rounded shadow-xs hover:shadow-md transition-all active:scale-95"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            <div className="relative w-72 h-44 sm:w-96 sm:h-56 shrink-0 flex items-center justify-center">
              <Image
                src="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
                alt="High Processing Graphics Card"
                fill
                className="object-contain group-hover:scale-108 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 7. "Shop By New Products" Section (Staggered 4-Card Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16} duration={450}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Shop By New Products
            </h2>

            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded bg-[#FFBE00] flex items-center justify-center text-neutral-900 font-bold">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-full h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <StaggerContainer staggerDelay={80} duration={450} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopByNew.map((product, idx) => (
              <StaggerItem key={product.id} index={idx}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* 8. "Deals Of The Week" Section with Countdown (Smooth Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={18} duration={500}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Deals Of The Week
            </h2>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 bg-neutral-100 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4 text-[#FFBE00]" />
              <span>Ends In:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{String(timeLeft.days).padStart(2, '0')}d</span>
                <span>:</span>
                <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-white px-1.5 py-0.5 rounded shadow-2xs text-[#DF2020]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weeklyDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white border border-neutral-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 hover:border-[#FFBE00] hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative w-44 h-44 shrink-0 bg-neutral-50 rounded flex items-center justify-center">
                  <Image
                    src={deal.images?.[0] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80'}
                    alt={deal.title}
                    fill
                    className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                  />
                </div>

                <div className="space-y-2 flex-1 text-left">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    {deal.brand} · {deal.agentShopName}
                  </span>

                  <Link href={`/products/${deal.slug || deal.id}`}>
                    <h4 className="font-bold text-sm text-neutral-900 hover:text-[#0070F3] line-clamp-2 transition-colors">
                      {deal.title}
                    </h4>
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-neutral-900">
                      Rs {deal.basePrice.toLocaleString()}
                    </span>
                    {deal.compareAtPrice && (
                      <span className="text-xs text-neutral-400 line-through">
                        Rs {deal.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/products/${deal.slug || deal.id}`}
                      className="inline-block bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-5 py-2 rounded transition-colors shadow-2xs hover:shadow-xs"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 9. Gamer Blue Neon Lights Cabinet Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={20} duration={600}>
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-md">
            <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
              <Image
                src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80"
                alt="Gamer Blue Neon Lights Cabinet"
                fill
                className="object-contain group-hover:scale-108 transition-transform duration-700 ease-out"
              />
            </div>

            <div className="space-y-3 max-w-md z-10 text-center md:text-right">
              <span className="text-[11px] text-cyan-400 uppercase font-semibold tracking-wider">
                New Gaming PC Case
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Sprint Of <span className="text-[#FFBE00]">Gamer Blue Neon</span> <br />
                Lights Cabinet
              </h3>
              <div className="pt-2">
                <Link
                  href="/products?search=Case"
                  className="inline-block bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-6 py-2.5 rounded shadow-xs hover:shadow-md transition-all active:scale-95"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 10. "What Our Customer Says" (Staggered Testimonials Reveal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16} duration={450}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              What Our Customer Says
            </h2>

            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded bg-[#FFBE00] flex items-center justify-center text-neutral-900 font-bold">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <StaggerContainer staggerDelay={90} duration={500} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_REVIEWS.map((rev, i) => (
            <StaggerItem key={i} index={i}>
              <div className="border border-neutral-200 rounded-lg p-6 bg-white space-y-4 hover:border-[#FFBE00] hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left">
                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  &ldquo;{rev.quote}&rdquo;
                </p>

                <div className="flex text-[#FFBE00]">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-[#FFBE00] text-[#FFBE00]" />
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                  <div className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center font-bold text-xs">
                    {rev.author.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">{rev.author}</h5>
                    <p className="text-[10px] text-neutral-400">{rev.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* 11. Brand Logos Strip (Subtle Fade In) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ScrollReveal direction="up" distance={12} duration={400}>
          <div className="border-t border-b border-neutral-200 py-8">
            <div className="flex flex-wrap items-center justify-between gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="font-extrabold text-xl tracking-tighter text-neutral-800 hover:scale-105 transition-transform">ASUS</span>
              <span className="font-extrabold text-xl tracking-tight text-neutral-800 hover:scale-105 transition-transform">hp</span>
              <span className="font-extrabold text-xl tracking-widest text-neutral-800 hover:scale-105 transition-transform">DELL</span>
              <span className="font-extrabold text-xl tracking-wide text-neutral-800 hover:scale-105 transition-transform">BenQ</span>
              <span className="font-bold text-xl tracking-normal text-neutral-800 hover:scale-105 transition-transform">Lenovo</span>
              <span className="font-extrabold text-xl tracking-tighter text-neutral-800 hover:scale-105 transition-transform">NVIDIA</span>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
