'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Store, ArrowRight, ShieldCheck, Coins, Package, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPKR } from '@/lib/utils';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f1f5f9' width='200' height='200'/%3E%3Crect x='60' y='40' width='80' height='100' rx='8' fill='%23cbd5e1'/%3E%3Crect x='70' y='50' width='60' height='70' rx='4' fill='%23e2e8f0'/%3E%3C/svg%3E`;

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const { user } = useAuth();
  const [walletAmountToApply, setWalletAmountToApply] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your shopping cart is empty"
          description="Browse our verified catalog to add authentic smartphones, laptops, and hardware."
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      </div>
    );
  }

  // Group items by Agent
  const groupedByAgent = cart.reduce((acc, item) => {
    if (!acc[item.agentId]) {
      acc[item.agentId] = {
        agentName: item.agentShopName,
        items: [],
        subtotal: 0
      };
    }
    acc[item.agentId].items.push(item);
    acc[item.agentId].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { agentName: string; items: typeof cart; subtotal: number }>);

  const shippingFee = 500;
  const grandTotal = Math.max(0, subtotal + shippingFee - walletAmountToApply);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          Shopping Cart
          <span className="text-sm font-semibold text-ink-muted">({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
        </h1>
        <p className="text-xs text-ink-muted mt-1.5">Items are fulfilled directly by verified tech merchants across Pakistan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Grouped Cart Items */}
        <div className="lg:col-span-8 space-y-5">
          {Object.entries(groupedByAgent).map(([agentId, group]) => (
            <div key={agentId} className="bg-white rounded-2xl border border-border overflow-hidden luxury-glow-subtle">
              
              {/* Agent Group Header */}
              <div className="bg-gradient-to-r from-teal-50 to-white px-5 py-3.5 border-b border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-teal-900">Fulfilled by {group.agentName}</span>
                  <span className="flex items-center gap-1 text-[10px] text-teal-700 font-semibold bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <span className="text-xs text-teal-800 font-bold">{formatPKR(group.subtotal)}</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {group.items.map(item => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <Image
                          src={imgErrors[item.id] ? PLACEHOLDER_SVG : (item.image || PLACEHOLDER_SVG)}
                          alt={item.title}
                          fill
                          onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                          className="object-contain p-2"
                        />
                      </div>
                      <div>
                        <Link href={`/products/${item.productId}`}>
                          <h4 className="font-bold text-ink text-sm hover:text-brand transition-colors line-clamp-2 leading-snug max-w-xs">
                            {item.title}
                          </h4>
                        </Link>
                        <p className="text-sm font-extrabold text-teal-800 mt-1">{formatPKR(item.price)}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">per unit</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-3 py-2 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 text-xs font-extrabold text-ink min-w-[36px] text-center border-x border-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-3 py-2 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-extrabold text-base text-ink min-w-[110px] text-right">
                        {formatPKR(item.price * item.quantity)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Shipping & Returns Trust Strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Truck, label: 'Fast Delivery', desc: '24-48 Hours Nationwide' },
              { icon: ShieldCheck, label: 'Insured Courier', desc: 'Tamper-evident packaging' },
              { icon: RotateCcw, label: '7-Day Returns', desc: 'For any discrepancy' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border text-xs">
                <item.icon className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <div className="font-bold text-ink">{item.label}</div>
                  <div className="text-ink-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary & Checkout Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6 sticky top-24">
          <h3 className="font-extrabold text-base text-ink pb-4 border-b border-slate-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units)</span>
              <span className="font-semibold text-ink">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                Insured Shipping
              </span>
              <span className="font-semibold text-ink">{formatPKR(shippingFee)}</span>
            </div>

            {/* Wallet Apply Box */}
            {user && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Redeem Platform Rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Enter amount (Max Rs. 2,000)"
                    value={walletAmountToApply || ''}
                    onChange={(e) => setWalletAmountToApply(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                {walletAmountToApply > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold mt-2 text-xs">
                    <span>Wallet Credit Discount</span>
                    <span>− {formatPKR(walletAmountToApply)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-between">
              <span className="font-extrabold text-sm text-ink">Grand Total</span>
              <span className="text-xl font-black text-teal-800">{formatPKR(grandTotal)}</span>
            </div>
          </div>

          <Link href="/checkout" className="block">
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="text-center space-y-1">
            <p className="text-[11px] text-ink-muted">
              Cash on Delivery available nationwide
            </p>
            <p className="text-[11px] text-ink-muted">
              Grand total verified server-side at checkout
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
