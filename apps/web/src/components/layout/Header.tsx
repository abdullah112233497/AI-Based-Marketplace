'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  ChevronDown,
  Menu,
  X,
  LogOut,
  SlidersHorizontal,
  Store,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  Truck,
  RotateCcw,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Zap,
  Cpu,
  MapPin,
  Gamepad2,
  Monitor,
  ArrowRight,
  Flame,
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

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    router.push(`/products?${params.toString()}`);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 transition-all shadow-xs">

      {/* 1. Top Bar — Dark Charcoal with Announcements & Meta Links */}
      <div className="bg-[#191919] text-neutral-300 text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-neutral-300 font-normal truncate">
            Get Up To 50% Off on New Parts, Limited Time Only.
          </div>
          <div className="hidden md:flex items-center gap-5 text-neutral-400 text-xs">
            <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
              <span>En</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
              <span>PKR (Rs)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span className="text-neutral-700">|</span>
            <Link href="/orders" className="hover:text-white transition-colors">
              Track Your Order
            </Link>
            <span className="text-neutral-700">|</span>
            {user ? (
              <Link href="/account" className="hover:text-white transition-colors">
                My Account
              </Link>
            ) : (
              <Link href="/login" className="hover:text-white transition-colors">
                My Account
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-6">

          {/* Logo — Onetech Stylized Brand with Geometric Polygon Icon */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Onetech Iconic Colorful Hex Polygon */}
            <div className="w-8 h-8 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-8 h-8 fill-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#0070F3" />
                <path d="M18 2L32 10L18 18L4 10L18 2Z" fill="#FFBE00" />
                <path d="M18 18L32 10V26L18 34V18Z" fill="#00BCD4" />
                <path d="M4 10L18 18V34L4 26V10Z" fill="#0284C7" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tight text-neutral-900 group-hover:text-neutral-700 transition-colors">
                Onetech
              </span>
            </div>
          </Link>

          {/* Search Bar — Onetech 3-Part Category/Input/Yellow Search Button */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center border border-neutral-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-neutral-900 transition-colors"
          >
            {/* Category Select Dropdown */}
            <div className="relative shrink-0 border-r border-neutral-200">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-2 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="mobiles">Mobiles & Tablets</option>
                <option value="laptops">Laptops & Computers</option>
                <option value="accessories">Audio & Wearables</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Products..."
              className="flex-1 px-4 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none bg-transparent"
            />

            {/* Yellow Search Button */}
            <button
              type="submit"
              className="bg-[#FFBE00] hover:bg-[#EAB308] text-neutral-900 font-semibold text-xs px-6 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 tracking-wide"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </form>

          {/* Right Action Area — Sign In / Sign Up & User Avatar */}
          <div className="flex items-center gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <WalletBalanceChip />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-xs font-semibold text-neutral-800">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 animate-fade-up"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-neutral-100">
                        <p className="text-xs font-bold text-neutral-900">{user.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {user.role}
                        </span>
                      </div>

                      {user.role === UserRole.ADMIN && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          <ShieldCheck className="w-4 h-4 text-neutral-600" />
                          Admin Console
                        </Link>
                      )}

                      {user.role === UserRole.AGENT && (
                        <Link
                          href="/agent"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          <Store className="w-4 h-4 text-neutral-600" />
                          Merchant Portal
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <ShoppingCart className="w-4 h-4 text-neutral-500" />
                        Orders
                      </Link>

                      <Link
                        href="/wallet"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFBE00]" />
                        Rewards Wallet
                      </Link>

                      <div className="border-t border-neutral-100 mt-1 pt-1">
                        <button
                          onClick={logout}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-neutral-800 hover:text-[#0070F3] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[#DF2020] hover:bg-[#C91818] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-neutral-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navbar — Categories Dropdown & Utility Icons */}
      <div className="border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 text-xs">

            {/* Left Category Navigation Links with Interactive Dropdowns */}
            <div className="hidden md:flex items-center gap-7 font-medium text-neutral-700">
              
              {/* 1. Categories Dropdown */}
              <div className="relative group py-2.5">
                <Link
                  href="/products"
                  className="flex items-center gap-1 hover:text-[#0070F3] transition-colors font-semibold text-neutral-900"
                >
                  <span>Categories</span>
                  <ChevronDown className="w-3 h-3 text-neutral-500 group-hover:rotate-180 transition-transform duration-200" />
                </Link>

                <div className="absolute top-full left-0 pt-1 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-2 text-xs divide-y divide-neutral-100">
                    <div className="space-y-1 pb-2">
                      <Link
                        href="/products?category=mobiles"
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-neutral-50 group/item transition-colors"
                      >
                        <div className="p-1.5 rounded-md bg-blue-50 text-[#0070F3] group-hover/item:bg-[#0070F3] group-hover/item:text-white transition-colors mt-0.5">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 group-hover/item:text-[#0070F3] transition-colors">Mobiles & Tablets</p>
                          <p className="text-[11px] text-neutral-500">iPhones, Galaxy S-series, 5G devices</p>
                        </div>
                      </Link>

                      <Link
                        href="/products?category=laptops"
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-neutral-50 group/item transition-colors"
                      >
                        <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors mt-0.5">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 group-hover/item:text-[#0070F3] transition-colors">Laptops & Computers</p>
                          <p className="text-[11px] text-neutral-500">MacBooks, RTX Gaming rigs, Ultrabooks</p>
                        </div>
                      </Link>

                      <Link
                        href="/products?category=accessories"
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-neutral-50 group/item transition-colors"
                      >
                        <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors mt-0.5">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 group-hover/item:text-[#0070F3] transition-colors">Audio & Wearables</p>
                          <p className="text-[11px] text-neutral-500">AirPods, Smartwatches, studio gear</p>
                        </div>
                      </Link>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/products"
                        className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 text-[#0070F3] font-semibold text-[11px]"
                      >
                        <span>View All Categories</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Accessories Dropdown */}
              <div className="relative group py-2.5">
                <Link
                  href="/products?category=accessories"
                  className="flex items-center gap-1 hover:text-[#0070F3] transition-colors"
                >
                  <span>Accessories</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:rotate-180 transition-transform duration-200" />
                </Link>

                <div className="absolute top-full left-0 pt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-2 text-xs divide-y divide-neutral-100">
                    <div className="space-y-1 pb-2">
                      <Link
                        href="/products?category=accessories&search=Earbuds"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Headphones className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Wireless Earbuds</span>
                      </Link>
                      <Link
                        href="/products?category=accessories&search=Watch"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Watch className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Smartwatches & Bands</span>
                      </Link>
                      <Link
                        href="/products?category=accessories&search=Charger"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">GaN Fast Chargers</span>
                      </Link>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/products?category=accessories"
                        className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 text-[#0070F3] font-semibold text-[11px]"
                      >
                        <span>All Accessories</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Gaming Laptop Dropdown */}
              <div className="relative group py-2.5">
                <Link
                  href="/products?category=laptops"
                  className="flex items-center gap-1 hover:text-[#0070F3] transition-colors"
                >
                  <span>Gaming Laptop</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:rotate-180 transition-transform duration-200" />
                </Link>

                <div className="absolute top-full left-0 pt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-2 text-xs divide-y divide-neutral-100">
                    <div className="space-y-1 pb-2">
                      <Link
                        href="/products?category=laptops&search=RTX"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span className="group-hover/item:text-[#0070F3]">RTX 40-Series Power</span>
                      </Link>
                      <Link
                        href="/products?category=laptops&search=ASUS"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">ASUS ROG & TUF</span>
                      </Link>
                      <Link
                        href="/products?category=laptops&search=Legion"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Laptop className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Lenovo Legion Series</span>
                      </Link>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/products?category=laptops"
                        className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 text-[#0070F3] font-semibold text-[11px]"
                      >
                        <span>View All Laptops</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Enterprise Hubs Dropdown */}
              <div className="relative group py-2.5">
                <Link
                  href="/agents"
                  className="flex items-center gap-1 hover:text-[#0070F3] transition-colors"
                >
                  <span>Enterprise Hubs</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:rotate-180 transition-transform duration-200" />
                </Link>

                <div className="absolute top-full left-0 pt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-2 text-xs divide-y divide-neutral-100">
                    <div className="space-y-1 pb-2">
                      <Link
                        href="/agents?city=lahore"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="group-hover/item:text-[#0070F3]">Lahore (Hafeez Centre)</span>
                      </Link>
                      <Link
                        href="/agents?city=karachi"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="group-hover/item:text-[#0070F3]">Karachi (Techno City)</span>
                      </Link>
                      <Link
                        href="/agents?city=islamabad"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="group-hover/item:text-[#0070F3]">Islamabad / Rawalpindi</span>
                      </Link>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/agents"
                        className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 text-[#0070F3] font-semibold text-[11px]"
                      >
                        <span>All Verified Storefronts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Pre Built PC Dropdown */}
              <div className="relative group py-2.5">
                <Link
                  href="/products?search=PC"
                  className="flex items-center gap-1 hover:text-[#0070F3] transition-colors"
                >
                  <span>Pre Built PC</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:rotate-180 transition-transform duration-200" />
                </Link>

                <div className="absolute top-full left-0 pt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-2 text-xs divide-y divide-neutral-100">
                    <div className="space-y-1 pb-2">
                      <Link
                        href="/products?search=Gaming"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Monitor className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Custom Gaming Desktops</span>
                      </Link>
                      <Link
                        href="/products?search=Workstation"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Cpu className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Workstations & 3D Render</span>
                      </Link>
                      <Link
                        href="/products?search=PC"
                        className="flex items-center gap-2.5 p-2 rounded-md hover:bg-neutral-50 group/item text-neutral-800 transition-colors"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-neutral-400 group-hover/item:text-[#0070F3]" />
                        <span className="group-hover/item:text-[#0070F3]">Esports Budget Builds</span>
                      </Link>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/products?search=PC"
                        className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 text-[#0070F3] font-semibold text-[11px]"
                      >
                        <span>Explore All Systems</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Utility Links: Compare, Wishlist, Your Cart */}
            <div className="flex items-center gap-6 ml-auto font-medium text-neutral-700">

              {/* Compare */}
              <Link
                href="/compare"
                className="flex items-center gap-1.5 hover:text-[#0070F3] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                <span>Compare</span>
                {compareItems.length > 0 && (
                  <span className="bg-[#FFBE00] text-neutral-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {compareItems.length}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="flex items-center gap-1.5 hover:text-[#0070F3] transition-colors"
              >
                <Heart className="w-3.5 h-3.5 text-neutral-500" />
                <span>Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="bg-[#FFBE00] text-neutral-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Your Cart */}
              <Link
                href="/cart"
                className="flex items-center gap-1.5 hover:text-[#0070F3] transition-colors font-semibold text-neutral-900 group"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-neutral-800 group-hover:text-[#0070F3] transition-colors" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#DF2020] text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center ring-1 ring-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="ml-1">Your Cart</span>
              </Link>

            </div>

          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 p-4 space-y-4 animate-fade-up">
          <form onSubmit={handleSearchSubmit} className="flex border border-neutral-300 rounded-md overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 py-2 text-xs focus:outline-none"
            />
            <button type="submit" className="bg-[#FFBE00] px-4 py-2 text-neutral-900">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2 text-xs font-medium">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="py-2 px-1 text-neutral-800">
              All Categories
            </Link>
            <Link href="/products?category=mobiles" onClick={() => setMobileMenuOpen(false)} className="py-2 px-1 text-neutral-800">
              Mobiles & Tablets
            </Link>
            <Link href="/products?category=laptops" onClick={() => setMobileMenuOpen(false)} className="py-2 px-1 text-neutral-800">
              Gaming Laptops & Computers
            </Link>
            <Link href="/products?category=accessories" onClick={() => setMobileMenuOpen(false)} className="py-2 px-1 text-neutral-800">
              Audio & Accessories
            </Link>
            <Link href="/agents" onClick={() => setMobileMenuOpen(false)} className="py-2 px-1 text-neutral-800">
              Verified Physical Storefronts
            </Link>
          </div>
        </div>
      )}

    </header>
  );
}
