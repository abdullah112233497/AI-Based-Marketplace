import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CompareBar } from '@/components/marketplace/CompareBar';

export const metadata: Metadata = {
  title: 'Tech Marketplace — Verified Electronics & Specs Engine',
  description: 'Pakistan’s premier specification-focused tech store for authentic smartphones, gaming laptops, and computing gear from verified merchants.',
  keywords: 'smartphones, laptops, macbook, rtx 4080, pakistan tech marketplace, hafeez centre, technocity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
        <AppProviders>
          <Suspense fallback={<div className="h-16 bg-white border-b border-border" />}>
            <Header />
          </Suspense>
          <main className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-xs text-ink-muted">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <CompareBar />
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
