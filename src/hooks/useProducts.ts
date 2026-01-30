import { useState, useEffect } from 'react';
import { supabase, Product, Category } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts(categoryId?: string) {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('products').select('*').order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setProducts(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  async function getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (err) throw err;
      return data || null;
    } catch (err) {
      console.error('Failed to fetch product:', err);
      return null;
    }
  }

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    getProductBySlug,
  };
}
