'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProductSummary } from '@tech-marketplace/shared';

interface CompareContextType {
  compareItems: ProductSummary[];
  addToCompare: (product: ProductSummary) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<ProductSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tm_compare');
      if (saved) setCompareItems(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tm_compare', JSON.stringify(compareItems));
    }
  }, [compareItems, isLoaded]);

  const addToCompare = (product: ProductSummary) => {
    if (compareItems.length >= 4) {
      alert('You can compare a maximum of 4 products at a time.');
      return;
    }
    if (!compareItems.some(item => item.id === product.id)) {
      setCompareItems(prev => [...prev, product]);
    }
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  };

  const isInCompare = (productId: string) => compareItems.some(item => item.id === productId);

  const clearCompare = () => setCompareItems([]);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
