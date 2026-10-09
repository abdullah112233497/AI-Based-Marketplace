import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]';

    const variants = {
      primary: 'bg-gradient-to-b from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white focus:ring-teal-500/40 shadow-md shadow-teal-900/20 hover:shadow-lg hover:shadow-teal-900/25',
      secondary: 'bg-gradient-to-b from-teal-50 to-teal-100 text-teal-900 hover:from-teal-100 hover:to-teal-200 focus:ring-teal-500/30 border border-teal-200',
      outline: 'border border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300 focus:ring-teal-500/30',
      ghost: 'text-ink-muted hover:text-ink hover:bg-slate-100 focus:ring-slate-300',
      danger: 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white focus:ring-rose-500/40 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-sm px-6 py-3.5 gap-2.5 font-bold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
