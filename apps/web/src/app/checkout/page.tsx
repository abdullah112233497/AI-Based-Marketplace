'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { ShippingAddressSchema, PaymentMethod } from '@tech-marketplace/shared';
import { Button } from '@/components/ui/Button';
import { formatPKR } from '@/lib/utils';
import { z } from 'zod';

const CheckoutFormSchema = ShippingAddressSchema.extend({
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional()
});

type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [preview, setPreview] = useState<{
    subtotal: number;
    shippingFee: number;
    walletDiscount: number;
    grandTotal: number;
  } | null>(null);

  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      stateProvince: 'Pakistan',
      paymentMethod: PaymentMethod.COD
    }
  });

  // Fetch backend verified preview
  useEffect(() => {
    if (cart.length > 0) {
      apiFetch('/orders/preview', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
          applyWalletAmount: 0
        })
      })
        .then(res => {
          if (res?.data) setPreview(res.data);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, [cart]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    setIsPlacing(true);
    setErrorMsg(null);

    try {
      const orderPayload = {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          streetAddress: data.streetAddress,
          city: data.city,
          stateProvince: data.stateProvince,
          postalCode: data.postalCode
        },
        paymentMethod: data.paymentMethod,
        applyWalletAmount: 0,
        notes: data.notes
      };

      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (res?.data) {
        clearCart();
        router.push(`/orders/${res.data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your inventory or connection.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Cart is empty</h2>
        <p className="text-xs text-ink-muted mb-4">Add products before checking out.</p>
        <Button variant="primary" onClick={() => router.push('/products')}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-black text-ink tracking-tight">
          Checkout & Order Confirmation
        </h1>
        <p className="text-xs text-ink-muted">Complete delivery address and confirm fulfillment</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Shipping & Payment Options */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Shipping Form Card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-4 h-4 text-brand" />
              1. Delivery Address (Pakistan Nationwide)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  {...register('fullName')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="e.g. Usman Ali"
                />
                {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  {...register('phone')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="03001234567"
                />
                {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address / House #</label>
                <input
                  {...register('streetAddress')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="House 12, Street 4, Sector G-11/3"
                />
                {errors.streetAddress && <p className="text-[11px] text-rose-600 mt-1">{errors.streetAddress.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  {...register('city')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="Islamabad / Lahore / Karachi"
                />
                {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code (Optional)</label>
                <input
                  {...register('postalCode')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  placeholder="44000"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector Card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-brand" />
              2. Payment Method
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 cursor-pointer">
                <input
                  type="radio"
                  value={PaymentMethod.COD}
                  {...register('paymentMethod')}
                  className="text-brand focus:ring-brand"
                  defaultChecked
                />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-teal-700" />
                    <div>
                      <p className="text-xs font-bold text-ink">Cash On Delivery (COD)</p>
                      <p className="text-[11px] text-ink-muted">Inspect sealed package upon courier arrival</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  value={PaymentMethod.CARD_DEMO}
                  {...register('paymentMethod')}
                  className="text-brand focus:ring-brand"
                />
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-xs font-bold text-ink">Online Card / Instant Bank Transfer (Demo)</p>
                    <p className="text-[11px] text-ink-muted">Simulated test checkout</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right: Order Summary Preview */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-base text-ink pb-3 border-b border-slate-100">
            Order Verification
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-ink">{formatPKR(preview?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Insured Courier Fee</span>
              <span className="font-semibold text-ink">{formatPKR(preview?.shippingFee || 500)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-extrabold text-ink">
              <span>Verified Total</span>
              <span className="text-base text-teal-800">{formatPKR(preview?.grandTotal || 0)}</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPlacing}
            className="w-full flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Place Order</span>
          </Button>

          <p className="text-[11px] text-ink-muted text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Protected by Verified Spec Guarantee
          </p>
        </div>

      </form>
    </div>
  );
}
