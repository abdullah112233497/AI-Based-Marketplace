'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Sparkles,
  Store,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Laptop,
  Smartphone,
  Headphones,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useCompare } from '@/lib/compare-context';
import { WalletBalanceChip } from '../marketplace/WalletBalanceChip';
import { UserRole } from '@tech-marketplace/shared';

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { totalItems, wishlist } = useCart();
  const { compareItems } = useCompare();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-900 text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Verified Tech Vendors across Pakistan — 100% Genuine Spec Guarantee</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-[11px]">
            <Link href="/agents" className="hover:text-white transition-colors flex items-center gap-1.5 hover:text-teal-300">
              <Store className="w-3.5 h-3.5" />
              <span>Agent Directory</span>
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/register/agent" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Become a Verified Vendor →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all duration-300">
              TM
            </div>
            <div>
              <div className="font-extrabold text-ink text-lg tracking-tight leading-none group-hover:text-brand transition-colors">
                TECH<span className="text-brand">MARKET</span>
              </div>
              <div className="text-[9px] text-ink-muted uppercase tracking-[0.15em] font-semibold">
                Verified Tech Hub
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl hidden md:flex items-center">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search smartphones, MacBooks, GPUs, specs (RTX 4080, 512GB)..."
                className="w-full pl-10 pr-28 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-brand focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => alert('AI Product Advisor: Phase 4 AI/n8n integration coming soon!')}
                className="absolute right-1.5 top-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm hover:from-teal-500 hover:to-teal-600 transition-all"
                title="Ask AI Product Advisor"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Ask AI</span>
              </button>
            </div>
          </form>

          {/* Right Navigation & Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Wallet balance chip */}
            <WalletBalanceChip />

            {/* Compare items badge */}
            {compareItems.length > 0 && (
              <Link
                href="/compare"
                className="relative p-2 rounded-xl text-slate-600 hover:text-brand hover:bg-teal-50 transition-all"
                title="Compare Selected Products"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {compareItems.length}
                </span>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              href="/products"
              className="relative p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Saved Items"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 rounded-xl text-slate-600 hover:text-brand hover:bg-teal-50 transition-all"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px] bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Account / Auth menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block text-xs font-semibold text-ink max-w-[80px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border py-2 z-50 animate-scale-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-ink">{user.name}</p>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {user.role}
                      </span>
                    </div>

                    {user.role === UserRole.ADMIN && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        Super Admin Portal
                      </Link>
                    )}

                    {user.role === UserRole.AGENT && (
                      <Link href="/agent" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors">
                        <Store className="w-4 h-4 text-teal-600" />
                        Agent Merchant Dashboard
                      </Link>
                    )}

                    <Link href="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                      My Orders & Tracking
                    </Link>

                    <Link href="/wallet" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand transition-colors">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Rewards Wallet
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-brand hover:bg-slate-50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-teal-500/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-ink hover:bg-slate-100 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Categories Strip */}
        <div className="hidden md:flex items-center gap-5 py-2.5 border-t border-slate-100 text-xs font-medium">
          <Link href="/products" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-1.5 py-0.5 border-b-2 border-transparent hover:border-brand">
            All Products
          </Link>
          <Link href="/products?category=mobiles" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-1.5 py-0.5 border-b-2 border-transparent hover:border-brand">
            <Smartphone className="w-3.5 h-3.5" /> Mobiles & Tablets
          </Link>
          <Link href="/products?category=laptops" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-1.5 py-0.5 border-b-2 border-transparent hover:border-brand">
            <Laptop className="w-3.5 h-3.5" /> Laptops & Computers
          </Link>
          <Link href="/products?category=accessories" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-1.5 py-0.5 border-b-2 border-transparent hover:border-brand">
            <Headphones className="w-3.5 h-3.5" /> Audio & Wearables
          </Link>
          <Link href="/compare" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-1.5 py-0.5 border-b-2 border-transparent hover:border-brand">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Compare
          </Link>
          <Link href="/agents" className="ml-auto text-teal-700 hover:text-teal-900 font-semibold transition-colors flex items-center gap-1.5 py-0.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Shops
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border p-4 space-y-3 animate-fade-up">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones, specs..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex flex-col space-y-0.5 pt-2 border-t border-slate-100 text-sm">
            {[
              { href: '/products', label: 'Browse All Products' },
              { href: '/products?category=mobiles', label: 'Mobiles & Tablets' },
              { href: '/products?category=laptops', label: 'Laptops & Computers' },
              { href: '/products?category=accessories', label: 'Audio & Wearables' },
              { href: '/agents', label: 'Verified Agent Shops' },
              { href: '/compare', label: 'Compare Products' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-2 text-slate-700 hover:text-brand hover:bg-teal-50 rounded-xl text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/register/agent"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-2 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
            >
              Sell on Tech Marketplace
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
