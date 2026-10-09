'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { OrderSummary, OrderStatus } from '@tech-marketplace/shared';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPKR, formatDate } from '@/lib/utils';

export default function OrdersHistoryPage() {
  const { user } = useAuth();

  const { data: res, isLoading } = useQuery<{ success: boolean; data: OrderSummary[] }>({
    queryKey: ['my-orders'],
    queryFn: () => apiFetch('/orders/my-orders'),
    enabled: !!user
  });

  const orders = res?.data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-brand" />
          My Orders & Shipments
        </h1>
        <p className="text-xs text-ink-muted">Track order fulfillment and verified hardware deliveries</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-full h-32 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="You haven't placed any tech orders yet. Browse our verified products to get started."
          actionLabel="Explore Catalog"
          actionHref="/products"
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-ink text-sm">Order #{order.orderNumber}</h3>
                  <Badge variant={order.status === OrderStatus.DELIVERED ? 'success' : 'brand'}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted">
                  Placed on {formatDate(order.createdAt)} • {order.items.length} items
                </p>
                <p className="text-xs text-teal-800 font-bold">
                  {formatPKR(order.totalAmount)} ({order.paymentMethod})
                </p>
              </div>

              <Link
                href={`/orders/${order.id}`}
                className="px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 w-fit"
              >
                <span>View Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
