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
    md: { price: 'text-base font-bold', compare: 'text-xs', badge: 'text-xs' },
    lg: { price: 'text-xl font-bold', compare: 'text-sm', badge: 'text-xs' },
    xl: { price: 'text-2xl lg:text-3xl font-extrabold', compare: 'text-base', badge: 'text-xs' },
  };

  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('text-ink tracking-tight', sizeStyles[size].price)}>
        {formatPKR(price)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <>
          <span className={cn('text-ink-muted line-through', sizeStyles[size].compare)}>
            {formatPKR(compareAtPrice)}
          </span>
          <span className={cn('text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.5 rounded', sizeStyles[size].badge)}>
            {discount}% OFF
          </span>
        </>
      )}
    </div>
  );
}
