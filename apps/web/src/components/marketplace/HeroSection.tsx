'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, SlidersHorizontal, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance sequence after initial paint
    const timer = setTimeout(() => {
      setMounted(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-4 pb-2">
      {/* Subtle ambient lighting / depth background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFF8E1]/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-[#E1F5FE]/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* Bento Main Hero Card (7 Cols) — High Impact Showcase */}
          <div className="lg:col-span-7 bg-[#F5F6F8] rounded-2xl p-7 sm:p-10 flex flex-col sm:flex-row justify-between items-center relative overflow-hidden border border-neutral-200/70 shadow-xs group">

            {/* Subtle decorative radial glow behind hardware */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#FFBE00]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Left Content — Sequenced Entrance */}
            <div className="z-10 max-w-sm space-y-4 mb-6 sm:mb-0 text-left">

              {/* Kicker Tag */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/90 text-neutral-800 text-[11px] font-semibold tracking-wide shadow-2xs transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#FFBE00] fill-[#FFBE00]" />
                <span>Hurry Up Limited Time Offer Only!</span>
              </div>

              {/* Main Headline */}
              <h1
                className={`text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-neutral-900 leading-[1.12] tracking-tight transition-all duration-600 delay-100 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
              >
                Get Your Lightning <br />
                MSI <span className="text-[#0070F3]">Graphics Card</span>
              </h1>

              {/* Value Proposition Description */}
              <p
                className={`text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal transition-all duration-600 delay-200 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
              >
                Direct procurement from authenticated physical technology hubs in Hafeez Centre, Techno City, Blue Area, and Saddar. Complete with factory serial validation and physical store receipts.
              </p>

              {/* Call-To-Action Buttons */}
              <div
                className={`flex flex-wrap items-center gap-3 pt-2 transition-all duration-600 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
              >
                <Link
                  href="/products?search=RTX"
                  className="inline-flex items-center gap-2 bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-bold text-xs px-6 py-3 rounded-md shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.98] group/btn"
                >
                  <span>Shop Now</span>
                  <div className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[9px] group-hover/btn:translate-x-0.5 transition-transform">
                    →
                  </div>
                </Link>

                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-xs px-5 py-3 rounded-md border border-neutral-300 hover:border-neutral-900 transition-all duration-200 shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Compare Specs</span>
                </Link>
              </div>

              {/* Micro Trust Points */}
              <div
                className={`pt-2 flex items-center gap-4 text-[11px] text-neutral-500 font-medium transition-all duration-600 delay-400 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                  <span>Verified Warranty</span>
                </span>
                <span>·</span>
                <span>Serial Tracked</span>
              </div>
            </div>

            {/* Right Dominant Hardware Showcase — Glides in with subtle float */}
            <div
              className={`relative w-64 h-64 sm:w-72 sm:h-72 shrink-0 flex items-center justify-center transition-all duration-700 delay-250 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
                }`}
            >
              <Image
                src="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
                alt="MSI Lightning Graphics Card"
                fill
                priority
                className="object-contain transition-transform duration-700 ease-out group-hover:scale-108 group-hover:-rotate-1"
              />
            </div>
          </div>

          {/* Bento Right Column (5 Cols): Monitor, Mouse & Keyboard Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">

            {/* Top Right Card: Dell 4K Resolution Monitor */}
            <div
              className={`bg-[#F5F6F8] rounded-2xl p-6 flex items-center justify-between overflow-hidden border border-neutral-200/70 shadow-xs hover:border-[#FFBE00] hover:shadow-md transition-all duration-600 delay-350 ease-out group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`}
            >
              <div className="space-y-1.5 max-w-[170px] z-10 text-left">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  The All New In One
                </span>
                <h3 className="text-base font-bold text-neutral-900 leading-snug">
                  Dell 4K Resolution <br />
                  <span className="text-[#0070F3]">1080p Monitor</span>
                </h3>
                <Link
                  href="/products?search=Monitor"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 hover:text-[#0070F3] pt-1 transition-colors"
                >
                  <span>Shop Now</span>
                  <span className="text-[#FFBE00]">●</span>
                </Link>
              </div>

              <div className="relative w-36 h-28 shrink-0 flex items-center justify-center">
                <Image
                  src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"
                  alt="Dell 4K Monitor"
                  fill
                  className="object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
                />
              </div>
            </div>

            {/* Bottom Right Row: 2 Split Mini Cards (Mouse & Keyboard) */}
            <div className="grid grid-cols-2 gap-4">

              {/* Dragon Wired Mouse */}
              <div
                className={`bg-[#F5F6F8] rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-neutral-200/70 shadow-xs hover:border-[#FFBE00] hover:shadow-md transition-all duration-600 delay-450 ease-out group min-h-[160px] text-left ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-medium">Fast As Real Bat</span>
                  <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                    Dragon Wired <br />
                    <span className="text-[#0070F3]">Mouse</span>
                  </h4>
                  <Link
                    href="/products?search=Mouse"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:text-[#0070F3] pt-1 transition-colors"
                  >
                    <span>Shop Now</span>
                    <span className="text-[#FFBE00]">●</span>
                  </Link>
                </div>

                <div className="relative w-full h-20 mt-2 flex items-center justify-center">
                  <Image
                    src="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80"
                    alt="Gaming Mouse"
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

              {/* Dragon Wired Keyboard */}
              <div
                className={`bg-[#F5F6F8] rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-neutral-200/70 shadow-xs hover:border-[#FFBE00] hover:shadow-md transition-all duration-600 delay-550 ease-out group min-h-[160px] text-left ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-medium">Mindbody Faster</span>
                  <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                    Dragon Wired <br />
                    <span className="text-[#0070F3]">Keyboard</span>
                  </h4>
                  <Link
                    href="/products?search=Keyboard"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:text-[#0070F3] pt-1 transition-colors"
                  >
                    <span>Shop Now</span>
                    <span className="text-[#FFBE00]">●</span>
                  </Link>
                </div>

                <div className="relative w-full h-20 mt-2 flex items-center justify-center">
                  <Image
                    src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80"
                    alt="Gaming Keyboard"
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
