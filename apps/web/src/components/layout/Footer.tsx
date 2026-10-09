import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-300 pt-0 pb-0 border-t border-slate-800/60">
      
      {/* CTA Newsletter Strip */}
      <div className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-teal-900/40 to-slate-800/40 border border-teal-800/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-800/50 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Get Deal Alerts & Spec Updates</h4>
                <p className="text-xs text-slate-400 mt-0.5">Be first to know when verified stock arrives</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 sm:w-64 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
              />
              <button className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 transition-all shadow-lg shadow-teal-900/30">
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-md">
              TM
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              TECH<span className="text-teal-400">MARKET</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-5">
            Pakistan's premier specification-driven marketplace for authentic smartphones, high-performance laptops, and computing gear from verified physical stores.
          </p>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Hafeez Centre · Techno City · Blue Area · Saddar</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>support@techmarketplace.pk</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Browse Tech</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link href="/products?category=mobiles" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Flagship Mobiles</Link></li>
            <li><Link href="/products?category=laptops" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Gaming Laptops</Link></li>
            <li><Link href="/products?category=accessories" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Wireless Audio</Link></li>
            <li><Link href="/compare" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Compare Devices</Link></li>
            <li><Link href="/products" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Full Catalog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Vendors & Agents</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link href="/agents" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Shop Directory</Link></li>
            <li><Link href="/register/agent" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Vendor Registration</Link></li>
            <li><Link href="/agent" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Merchant Portal</Link></li>
            <li><Link href="/admin" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Admin Gateway</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link href="/orders" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Track Orders</Link></li>
            <li><Link href="/wallet" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Rewards Wallet</Link></li>
            <li><Link href="/cart" className="hover:text-teal-400 transition-colors hover:translate-x-0.5 inline-block">Shopping Cart</Link></li>
            <li><span className="text-slate-500">COD Available Nationwide</span></li>
            <li><span className="text-slate-500">PTA Verification Info</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {currentYear} Tech Marketplace Pakistan. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Next.js 14 · Express · TypeScript</span>
            <div className="flex items-center gap-1.5 text-teal-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Specs Verified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
