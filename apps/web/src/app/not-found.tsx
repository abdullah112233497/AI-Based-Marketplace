import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
        404 — Page Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight mb-3">
        The hardware page you are looking for does not exist.
      </h1>
      <p className="text-xs text-neutral-500 max-w-md mx-auto mb-8">
        It may have been moved, delisted by the merchant, or the URL address was typed incorrectly.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="primary" size="md" pill>
            Return to Storefront
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" size="md" pill>
            Browse Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}
