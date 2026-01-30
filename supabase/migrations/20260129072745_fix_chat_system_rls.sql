/*
  # Fix Chat System RLS Policies

  1. Changes
    - Add UPDATE policy for conversations to allow updating updated_at
    - Add UPDATE policy for quotes to allow modifying quote status
    - Add trigger to auto-update updated_at on conversations
    - Add trigger to auto-update updated_at on quotes

  2. Security
    - Users can only update their own conversations
    - Users can only update their own quotes
*/

-- Drop existing policies if they exist to recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers update own conversations" ON conversations;
  DROP POLICY IF EXISTS "Customers update own quotes" ON quotes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow customers to update their own conversations
CREATE POLICY "Customers update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Allow customers to update their own quotes
CREATE POLICY "Customers update own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for quotes
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation's updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
