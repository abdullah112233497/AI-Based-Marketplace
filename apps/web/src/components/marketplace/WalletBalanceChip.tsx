'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatPKR } from '@/lib/utils';

export function WalletBalanceChip() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      apiFetch<{ success: boolean; data: { balance: number } }>('/customer/wallet')
        .then(res => {
          if (res?.data) setBalance(res.data.balance);
        })
        .catch(() => setBalance(null));
    } else {
      setBalance(null);
    }
  }, [user]);

  if (!user || balance === null) return null;

  return (
    <Link
      href="/wallet"
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs"
      title="Platform Wallet Rewards Balance"
    >
      <Coins className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
      <span>{formatPKR(balance)}</span>
    </Link>
  );
}
