import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      pill = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const roundedStyle = pill ? 'rounded-full' : 'rounded-xl';

    const variants = {
      primary:
        'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-900/30 shadow-xs',
      secondary:
        'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-900/20 border border-neutral-200',
      outline:
        'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 focus:ring-neutral-900/20 shadow-xs',
      ghost:
        'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-200',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/30 shadow-xs',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 font-medium',
      md: 'text-sm px-5 py-2.5 gap-2 font-medium',
      lg: 'text-sm px-6 py-3 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, roundedStyle, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
