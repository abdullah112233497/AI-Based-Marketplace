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
    brand: 'bg-brand-soft text-brand-900 border border-teal-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    accent: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full',
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
