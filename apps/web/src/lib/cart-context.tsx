'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProductSummary } from '@tech-marketplace/shared';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  agentId: string;
  agentShopName: string;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: ProductSummary, quantity?: number, variantId?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tm_cart');
      const savedWishlist = localStorage.getItem('tm_wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error('Error loading cart from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tm_cart', JSON.stringify(cart));
      localStorage.setItem('tm_wishlist', JSON.stringify(wishlist));
    }
  }, [cart, wishlist, isLoaded]);

  const addToCart = (product: ProductSummary, quantity = 1, variantId?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.variantId === variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, product.stock);
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `${product.id}_${variantId || 'base'}`,
            productId: product.id,
            variantId,
            title: product.title,
            image: product.images[0] || '',
            price: product.basePrice,
            quantity: Math.min(quantity, product.stock),
            stock: product.stock,
            agentId: product.agentId,
            agentShopName: product.agentShopName
          }
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        toggleWishlist,
        isInWishlist
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
