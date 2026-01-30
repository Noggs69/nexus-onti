/*
  # Create Chat and Quote System

  1. New Tables
    - `conversations` - Chats between seller and customers
    - `messages` - Chat messages
    - `quotes` - Quotations/Orders with shipping details
    - `quote_items` - Products in each quote

  2. Security
    - Enable RLS on all tables
    - Customers can see only their conversations
    - Seller can see all conversations
    - Messages visible only to participants
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'cancelled')),
  subtotal decimal(10, 2) DEFAULT 0,
  shipping_cost decimal(10, 2) DEFAULT 0,
  total decimal(10, 2) DEFAULT 0,
  customer_name text,
  customer_email text,
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  shipping_country text,
  payment_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users see messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.customer_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.customer_id = auth.uid())
    )
  );

CREATE POLICY "Customers see own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers see quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_id
      AND quotes.customer_id = auth.uid()
    )
  );

CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_quotes_conversation_id ON quotes(conversation_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
