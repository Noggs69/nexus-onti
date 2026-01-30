import React, { createContext, useEffect, useState } from 'react';
import { supabase, CartItem, Product } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  async function fetchCart() {
    try {
      if (!user) return;
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);

      if (err) throw err;
      setItems(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string, quantity: number) {
    try {
      if (!user) throw new Error('Must be logged in');
      setError(null);

      const { error: err } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });

      if (err) throw err;
      await fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(message);
      throw err;
    }
  }

  async function removeFromCart(productId: string) {
    try {
      if (!user) throw new Error('Must be logged in');
      setError(null);

      const { error: err } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (err) throw err;
      await fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove from cart';
      setError(message);
      throw err;
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    try {
      if (!user) throw new Error('Must be logged in');
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      setError(null);

      const { error: err } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (err) throw err;
      await fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quantity';
      setError(message);
      throw err;
    }
  }

  async function clearCart() {
    try {
      if (!user) throw new Error('Must be logged in');
      setError(null);

      const { error: err } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (err) throw err;
      setItems([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(message);
      throw err;
    }
  }

  function getTotal(): number {
    return items.reduce((total, item) => {
      const product = item.product as unknown as Product;
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }

  function getItemCount(): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
