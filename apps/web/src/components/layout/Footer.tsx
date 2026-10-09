'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-600">
      
      {/* 1. Vibrant Yellow Newsletter Bar (Directly from Reference Image) */}
      <div className="bg-[#FFBE00] text-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl font-bold tracking-tight text-neutral-900">
              Join Our Newsletter, Get 10% Off!
            </h3>
            <p className="text-xs text-neutral-800 font-medium">
              Receive verified deals, flash discount vouchers, and hardware stock drops first.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 w-full md:w-auto max-w-md">
            <input
              type="email"
              placeholder="Enter your email address..."
              className="flex-1 md:w-80 px-4 py-2.5 bg-white text-xs text-neutral-900 rounded-md border border-neutral-300 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              type="submit"
              className="bg-[#191919] hover:bg-neutral-800 text-white font-semibold text-xs px-6 py-2.5 rounded-md transition-colors shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Sitemaps Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        
        {/* Brand identity column */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-7 h-7 fill-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#0070F3" />
                <path d="M18 2L32 10L18 18L4 10L18 2Z" fill="#FFBE00" />
                <path d="M18 18L32 10V26L18 34V18Z" fill="#00BCD4" />
                <path d="M4 10L18 18V34L4 26V10Z" fill="#0284C7" />
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight text-neutral-900">
              Onetech
            </span>
          </Link>

          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
            Pakistan’s trusted technology hardware marketplace connecting enterprise and retail buyers directly with authenticated physical electronics stores across Lahore, Karachi, Islamabad, and Rawalpindi.
          </p>

          <div className="space-y-2 pt-2 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span className="font-semibold text-neutral-900">+92 (042) 111-TECH-PK</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span>Hafeez Centre · Techno City · Blue Area · Saddar</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span>support@onetech.pk</span>
            </div>
          </div>
        </div>

        {/* Find It Fast */}
        <div>
          <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">
            Find It Fast
          </h5>
          <ul className="space-y-2.5 text-xs text-neutral-500">
            <li>
              <Link href="/products?category=mobiles" className="hover:text-[#0070F3] transition-colors">
                Smartphones & Tablets
              </Link>
            </li>
            <li>
              <Link href="/products?category=laptops" className="hover:text-[#0070F3] transition-colors">
                Laptops & Workstations
              </Link>
            </li>
            <li>
              <Link href="/products?category=accessories" className="hover:text-[#0070F3] transition-colors">
                Audio & Wearables
              </Link>
            </li>
            <li>
              <Link href="/products?search=RTX" className="hover:text-[#0070F3] transition-colors">
                Gaming Graphics Cards
              </Link>
            </li>
            <li>
              <Link href="/products?search=SSD" className="hover:text-[#0070F3] transition-colors">
                High-Speed SSDs & RAM
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">
            Customer Care
          </h5>
          <ul className="space-y-2.5 text-xs text-neutral-500">
            <li>
              <Link href="/account" className="hover:text-[#0070F3] transition-colors">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-[#0070F3] transition-colors">
                Order Tracking
              </Link>
            </li>
            <li>
              <Link href="/compare" className="hover:text-[#0070F3] transition-colors">
                Compare Hardware
              </Link>
            </li>
            <li>
              <Link href="/wallet" className="hover:text-[#0070F3] transition-colors">
                Rewards Wallet
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-[#0070F3] transition-colors">
                7-Day Returns & Inspection
              </Link>
            </li>
          </ul>
        </div>

        {/* Physical Store Hubs */}
        <div>
          <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-4">
            Verified Physical Hubs
          </h5>
          <ul className="space-y-2.5 text-xs text-neutral-500">
            <li>
              <Link href="/agents/techzone-hafeez-centre" className="hover:text-[#0070F3] transition-colors">
                TechZone Hafeez Centre (Lahore)
              </Link>
            </li>
            <li>
              <Link href="/agents/galaxy-hub-technocity" className="hover:text-[#0070F3] transition-colors">
                Galaxy Hub Techno City (Karachi)
              </Link>
            </li>
            <li>
              <Link href="/agents/apex-tech-blue-area" className="hover:text-[#0070F3] transition-colors">
                Apex Tech Blue Area (Islamabad)
              </Link>
            </li>
            <li>
              <Link href="/agents/rawal-digital-rawalpindi" className="hover:text-[#0070F3] transition-colors">
                Rawal Digital Saddar (Rawalpindi)
              </Link>
            </li>
            <li>
              <Link href="/register/agent" className="text-neutral-900 font-semibold hover:text-[#0070F3] transition-colors flex items-center gap-1">
                <span>Sell With Us</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* 3. Bottom Legal Bar */}
      <div className="border-t border-neutral-200 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Onetech / TechMarket Pakistan. All rights reserved.</p>

          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
              <span>100% Genuine Hardware</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
              <span>PTA Pre-Verified</span>
            </span>
            <span>·</span>
            <span>Physical Store Invoices</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
