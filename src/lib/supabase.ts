import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  featured: boolean;
  specs: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  video_name: string;
  video_size: number;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'provider';
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface Conversation {
  id: string;
  customer_id: string;
  provider_id?: string | null;
  product_id: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'video' | 'document';
  attachment_name?: string;
  attachment_size?: number;
  created_at: string;
}

export interface Quote {
  id: string;
  conversation_id: string;
  customer_id: string;
  status: 'pending' | 'sent' | 'paid' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  total: number;
  customer_name: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface EmailNotification {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  conversation_id: string | null;
  sent: boolean;
  created_at: string;
  sent_at: string | null;
}
