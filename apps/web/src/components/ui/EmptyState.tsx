import React from 'react';
import Link from 'next/link';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 lg:p-20 text-center bg-white rounded-2xl border border-border luxury-glow-subtle">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center text-teal-600 mb-6 shadow-inner">
        <Icon className="w-9 h-9" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-extrabold text-ink mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-8 leading-relaxed">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button variant="primary" size="lg">{actionLabel}</Button>
          </Link>
        ) : (
          <Button variant="primary" size="lg" onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
