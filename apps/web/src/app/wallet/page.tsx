'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, Gift } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { WalletLedgerEntry, WalletTransactionType } from '@tech-marketplace/shared';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPKR, formatDate } from '@/lib/utils';

export default function WalletPage() {
  const { user } = useAuth();

  const { data: res, isLoading } = useQuery<{
    success: boolean;
    data: { balance: number; ledgers: WalletLedgerEntry[] };
  }>({
    queryKey: ['wallet-data'],
    queryFn: () => apiFetch('/customer/wallet'),
    enabled: !!user
  });

  const balance = res?.data?.balance || 0;
  const ledgers = res?.data?.ledgers || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-500" />
          Platform Rewards & Wallet Ledger
        </h1>
        <p className="text-xs text-ink-muted">Earn cashback on hardware purchases and redeem directly during checkout</p>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Available Reward Balance</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-1 mb-2">
              {formatPKR(balance)}
            </h2>
            <p className="text-xs text-slate-300">
              Redeemable up to 50% of any tech hardware order value.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg text-center transition-all"
            >
              Shop & Earn 2% Cashback
            </Link>
          </div>
        </div>
      </div>

      {/* Immutable Transaction Ledger */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-ink pb-3 border-b border-slate-100 flex items-center gap-2">
          <Gift className="w-4 h-4 text-brand" />
          Reward Ledger History
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-16 rounded-xl" />)}
          </div>
        ) : ledgers.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No ledger records yet"
            description="Your cashback transactions and promotional balances will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {ledgers.map(entry => {
              const isPositive = entry.amount > 0;
              return (
                <div key={entry.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-ink text-xs">{entry.description}</p>
                      <p className="text-[11px] text-ink-muted">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-black text-xs ${isPositive ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isPositive ? `+ ${formatPKR(entry.amount)}` : formatPKR(entry.amount)}
                    </p>
                    <p className="text-[10px] text-ink-muted">Balance: {formatPKR(entry.balanceAfter)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
