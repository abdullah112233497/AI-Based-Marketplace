'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { OrderSummary, OrderStatus } from '@tech-marketplace/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPKR, formatDate } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: res, isLoading } = useQuery<{ success: boolean; data: OrderSummary }>({
    queryKey: ['order-detail', orderId],
    queryFn: () => apiFetch(`/orders/${orderId}`),
    enabled: !!orderId
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  const order = res?.data;

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Order Not Found</h2>
        <p className="text-xs text-ink-muted mb-6">The requested order number could not be retrieved.</p>
        <Link href="/orders"><Button variant="primary">View My Orders</Button></Link>
      </div>
    );
  }

  const steps = [
    { key: OrderStatus.PENDING, label: 'Order Placed', desc: 'Awaiting vendor confirmation' },
    { key: OrderStatus.CONFIRMED, label: 'Confirmed & Packed', desc: 'Package sealed with spec seal' },
    { key: OrderStatus.SHIPPED, label: 'Dispatched in Transit', desc: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Courier pickup assigned' },
    { key: OrderStatus.DELIVERED, label: 'Delivered', desc: 'Verified & received by customer' },
  ];

  const statusHierarchy: Record<OrderStatus, number> = {
    [OrderStatus.PENDING]: 0,
    [OrderStatus.CONFIRMED]: 1,
    [OrderStatus.SHIPPED]: 2,
    [OrderStatus.DELIVERED]: 3,
    [OrderStatus.CANCELLED]: -1,
  };

  const currentStepIdx = statusHierarchy[order.status];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link href="/orders" className="text-xs text-brand hover:text-brand-900 font-semibold flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-ink tracking-tight">
              Order {order.orderNumber}
            </h1>
            <Badge variant={order.status === OrderStatus.DELIVERED ? 'success' : order.status === OrderStatus.CANCELLED ? 'danger' : 'brand'}>
              {order.status}
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-ink-muted">Total Amount</p>
          <p className="text-xl font-black text-teal-800">{formatPKR(order.totalAmount)}</p>
        </div>
      </div>

      {/* Stepper Status Timeline */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-6">
          Fulfillment Timeline & Spec Verification
        </h3>

        {order.status === OrderStatus.CANCELLED ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            This order has been cancelled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="flex md:flex-col items-start gap-3 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isCompleted ? 'text-ink' : 'text-slate-400'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column: Items list & Delivery Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Items List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-ink pb-3 border-b border-slate-100">
            Items in this Shipment
          </h3>

          <div className="divide-y divide-slate-100 space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                    <Image src={item.productImage || ''} alt={item.productTitle} fill className="object-contain p-1" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink text-xs line-clamp-1">{item.productTitle}</h4>
                    <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                      <Store className="w-3 h-3 text-teal-600" />
                      {item.agentShopName}
                    </p>
                    <p className="text-[11px] text-ink-muted">Qty: {item.quantity} × {formatPKR(item.unitPrice)}</p>
                  </div>
                </div>

                <span className="font-bold text-xs text-ink">{formatPKR(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Shipping Fee</span>
              <span>{formatPKR(order.shippingFee)}</span>
            </div>
            {order.walletDeduction > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Wallet Rewards Applied</span>
                <span>- {formatPKR(order.walletDeduction)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-ink pt-2 border-t border-slate-200">
              <span>Total Paid / Due on Delivery</span>
              <span className="text-teal-800">{formatPKR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand" />
              Delivery Destination
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-ink">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.streetAddress}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.stateProvince}</p>
              <p className="text-ink font-semibold">Contact: {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand" />
              Payment & Guarantee
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Method: <span className="font-bold text-ink">{order.paymentMethod}</span></p>
              <p>Payment Status: <span className="font-bold text-teal-700">{order.paymentStatus}</span></p>
              <p className="text-[11px] text-ink-muted pt-2 border-t border-slate-100">
                Eligible for 7-day spec accuracy inspection policy upon delivery.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
