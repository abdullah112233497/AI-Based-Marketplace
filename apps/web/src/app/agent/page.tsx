'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Truck,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  UserRole,
  AgentStatus,
  ProductCondition,
  ProductStatus,
  OrderStatus,
  CategorySpecSchema
} from '@tech-marketplace/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPKR, formatDate } from '@/lib/utils';

export default function AgentDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'new_product'>('overview');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('mobiles');

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCondition, setNewCondition] = useState<ProductCondition>(ProductCondition.NEW);
  const [newPrice, setNewPrice] = useState<number>(150000);
  const [newStock, setNewStock] = useState<number>(10);
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80');
  const [newSpecs, setNewSpecs] = useState<Record<string, any>>({
    ram_gb: '12',
    storage_gb: '256',
    pta_approved: 'Official PTA Approved'
  });

  // Fetch Agent Overview
  const { data: overviewRes, isLoading: loadingOverview } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['agent-overview'],
    queryFn: () => apiFetch('/agent/overview'),
    enabled: !!user
  });

  // Fetch Agent Products
  const { data: productsRes } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['agent-products'],
    queryFn: () => apiFetch('/agent/products'),
    enabled: activeTab === 'products'
  });

  // Fetch Agent Orders
  const { data: ordersRes } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['agent-orders'],
    queryFn: () => apiFetch('/agent/orders'),
    enabled: activeTab === 'orders'
  });

  // Fetch Dynamic Category Spec Schema for Form
  const { data: schemaRes } = useQuery<{ success: boolean; data: CategorySpecSchema }>({
    queryKey: ['category-specs-form', selectedCategorySlug],
    queryFn: () => apiFetch(`/categories/${selectedCategorySlug}/specs`)
  });

  // Transition Order Mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      apiFetch(`/agent/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, trackingNumber: `TCS-AUTO-${Math.floor(100000 + Math.random() * 900000)}` })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['agent-overview'] });
    }
  });

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch('/agent/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      alert('Product published successfully with verified dynamic specs!');
      setActiveTab('products');
      queryClient.invalidateQueries({ queryKey: ['agent-products'] });
      queryClient.invalidateQueries({ queryKey: ['agent-overview'] });
    },
    onError: (err: any) => {
      alert(`Failed to create product: ${err.message}`);
    }
  });

  // Update Product (status / price / stock)
  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      apiFetch(`/agent/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-products'] });
      queryClient.invalidateQueries({ queryKey: ['agent-overview'] });
    },
    onError: (err: any) => {
      alert(`Failed to update product: ${err.message}`);
    }
  });

  // Archive / Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) =>
      apiFetch(`/agent/products/${productId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-products'] });
      queryClient.invalidateQueries({ queryKey: ['agent-overview'] });
    },
    onError: (err: any) => {
      alert(`Failed to delete product: ${err.message}`);
    }
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      title: newTitle || 'Flagship Smartphone Edition 2026',
      description: newDesc || 'High performance genuine device sealed with local warranty and specifications.',
      categoryId: `cat_${selectedCategorySlug}`,
      brand: newBrand || 'Brand',
      condition: newCondition,
      images: [newImageUrl],
      basePrice: Number(newPrice),
      stock: Number(newStock),
      status: ProductStatus.PUBLISHED,
      specs: newSpecs,
      variants: []
    });
  };

  const overview = overviewRes?.data;
  const stats = overview?.stats || { totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0 };
  const products = productsRes?.data || [];
  const orders = ordersRes?.data || [];
  const specSchema = schemaRes?.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Merchant Header */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-ink tracking-tight">
                {overview?.agent?.shopName || 'Agent Vendor Portal'}
              </h1>
              <Badge variant="brand">Verified Merchant</Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Physical Hub: {overview?.agent?.address || 'Hafeez Centre, Lahore'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'new_product' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('new_product')}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add New Listing
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 text-xs font-bold">
        {[
          { key: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
          { key: 'products', label: 'My Listings & Stock', icon: Package },
          { key: 'orders', label: 'Order Fulfillment Queue', icon: ShoppingBag },
          { key: 'new_product', label: 'Create Spec Product', icon: Plus },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Gross Sales Revenue</span>
              <h3 className="text-2xl font-black text-teal-800 mt-1">{formatPKR(stats.totalSales)}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Pending Action Orders</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pendingOrders}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Active Product Listings</span>
              <h3 className="text-2xl font-black text-ink mt-1">{stats.totalProducts}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Vendor Store Rating</span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.rating} ★</h3>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {overview?.lowStockProducts && overview.lowStockProducts.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Low Stock Threshold Alerts (&lt; 5 units)
              </h3>
              <div className="divide-y divide-amber-200/50">
                {overview.lowStockProducts.map((p: any) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-950">{p.title}</span>
                    <span className="font-bold text-rose-700">{p.stock} left in stock</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink">Inventory Catalog</h3>
            <span className="text-xs text-ink-muted">{products.length} Products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="p-3.5">Product Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Condition</th>
                  <th className="p-3.5">Price (PKR)</th>
                  <th className="p-3.5">In Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-ink max-w-xs truncate">{p.title}</td>
                    <td className="p-3.5 text-ink-muted">{p.categoryName || p.categoryId}</td>
                    <td className="p-3.5"><Badge variant="neutral">{p.condition}</Badge></td>
                    <td className="p-3.5 font-bold text-teal-800">{formatPKR(p.basePrice)}</td>
                    <td className="p-3.5 font-bold">{p.stock}</td>
                    <td className="p-3.5">
                      <Badge variant={p.status === ProductStatus.PUBLISHED ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = p.status === ProductStatus.PUBLISHED ? ProductStatus.UNPUBLISHED : ProductStatus.PUBLISHED;
                            updateProductMutation.mutate({ productId: p.id, data: { status: newStatus } });
                          }}
                          disabled={updateProductMutation.isPending}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                        >
                          {p.status === ProductStatus.PUBLISHED ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const priceStr = prompt('Enter new price in PKR:', String(p.basePrice));
                            if (priceStr === null) return;
                            const price = parseInt(priceStr, 10);
                            if (isNaN(price) || price <= 0) return alert('Invalid price');
                            const stockStr = prompt('Enter new stock quantity:', String(p.stock));
                            if (stockStr === null) return;
                            const stock = parseInt(stockStr, 10);
                            if (isNaN(stock) || stock < 0) return alert('Invalid stock');
                            updateProductMutation.mutate({ productId: p.id, data: { basePrice: price, stock } });
                          }}
                          disabled={updateProductMutation.isPending}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                        >
                          Quick Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to archive "${p.title}"?`)) {
                              deleteProductMutation.mutate(p.id);
                            }
                          }}
                          disabled={deleteProductMutation.isPending}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Archive product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER FULFILLMENT QUEUE */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-ink pb-3 border-b border-slate-100">
            Order Fulfillment & Valid State Transitions
          </h3>

          <div className="space-y-4">
            {orders.map((ord: any) => (
              <div key={ord.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-ink">Order #{ord.orderNumber}</span>
                    <span className="ml-2 text-xs text-ink-muted">• {ord.customerName} ({ord.customerPhone})</span>
                  </div>
                  <Badge variant={ord.status === OrderStatus.DELIVERED ? 'success' : 'brand'}>
                    {ord.status}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600">
                  <p className="font-medium">Deliver to: {ord.shippingAddress.streetAddress}, {ord.shippingAddress.city}</p>
                </div>

                {/* State Transition Actions */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 mr-2">Transition Order:</span>

                  {ord.status === OrderStatus.PENDING && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: OrderStatus.CONFIRMED })}
                    >
                      Confirm & Pack
                    </Button>
                  )}

                  {ord.status === OrderStatus.CONFIRMED && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: OrderStatus.SHIPPED })}
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" /> Hand Over to Courier
                    </Button>
                  )}

                  {ord.status === OrderStatus.SHIPPED && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: OrderStatus.DELIVERED })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Delivered
                    </Button>
                  )}

                  {ord.status !== OrderStatus.DELIVERED && ord.status !== OrderStatus.CANCELLED && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: OrderStatus.CANCELLED })}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DYNAMIC PRODUCT CREATOR */}
      {activeTab === 'new_product' && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-md space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-xl font-black text-ink tracking-tight">Create Certified Product Listing</h2>
              <p className="text-xs text-ink-muted">Specs adapt dynamically based on selected category schema</p>
            </div>

            {/* AI Listing Copilot reserved slot (Phase 4) */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>AI Listing Copilot (Phase 4)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Category selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Category</label>
              <select
                value={selectedCategorySlug}
                onChange={(e) => setSelectedCategorySlug(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-ink"
              >
                <option value="mobiles">Mobiles & Tablets</option>
                <option value="laptops">Laptops & Computers</option>
                <option value="accessories">Audio & Wearables</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Samsung / Apple / ASUS"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Samsung Galaxy S24 Ultra (512GB, Titanium Black)"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price in PKR</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">In-Stock Quantity</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as ProductCondition)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value={ProductCondition.NEW}>New (Sealed Box)</option>
                <option value={ProductCondition.USED}>Used (Tested)</option>
                <option value={ProductCondition.REFURBISHED}>Refurbished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Detailed device condition, warranty details, and overview..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          {/* Dynamic Technical Specs Fields from Category Schema */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Dynamic Category Specification Fields ({specSchema?.categoryName || 'Specs'})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specSchema?.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {field.label} {field.unit ? `(${field.unit})` : ''}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={newSpecs[field.key] || ''}
                      onChange={(e) => setNewSpecs({ ...newSpecs, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt} {field.unit || ''}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={newSpecs[field.key] || ''}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => setNewSpecs({ ...newSpecs, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Publish Spec-Verified Listing
          </Button>
        </form>
      )}

    </div>
  );
}
