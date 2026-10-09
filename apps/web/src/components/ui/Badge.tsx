import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    brand: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
    accent: 'bg-amber-50 text-amber-900 border border-amber-300 font-medium',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide rounded-full',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
