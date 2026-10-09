import React from 'react';
import { formatPKR, cn } from '@/lib/utils';

export interface PriceTagProps {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PriceTag({ price, compareAtPrice, size = 'md', className }: PriceTagProps) {
  const sizeStyles = {
    sm: { price: 'text-sm font-semibold', compare: 'text-xs', badge: 'text-[10px]' },
    md: { price: 'text-base font-semibold', compare: 'text-xs', badge: 'text-[10px]' },
    lg: { price: 'text-xl font-semibold', compare: 'text-sm', badge: 'text-xs' },
    xl: { price: 'text-2xl lg:text-3xl font-semibold tracking-tight', compare: 'text-sm', badge: 'text-xs' },
  };

  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('text-ink font-semibold tracking-tight', sizeStyles[size].price)}>
        {formatPKR(price)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <>
          <span className={cn('text-neutral-400 line-through font-normal', sizeStyles[size].compare)}>
            {formatPKR(compareAtPrice)}
          </span>
          <span
            className={cn(
              'text-emerald-800 bg-emerald-50/90 font-medium px-1.5 py-0.5 rounded-md border border-emerald-200/70',
              sizeStyles[size].badge
            )}
          >
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
}
