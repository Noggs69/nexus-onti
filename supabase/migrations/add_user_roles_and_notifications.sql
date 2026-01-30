-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'provider'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing users to have a role (set first user as provider)
-- You can manually adjust this later
UPDATE profiles SET role = 'provider' WHERE id IN (
  SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
);

-- Create a function to send email notification when a new conversation is created
CREATE OR REPLACE FUNCTION notify_provider_new_conversation()
RETURNS TRIGGER AS $$
DECLARE
  provider_email TEXT;
  customer_name TEXT;
  customer_email TEXT;
BEGIN
  -- Get provider email
  SELECT email INTO provider_email
  FROM auth.users
  WHERE id = NEW.provider_id;
  
  -- Get customer info
  SELECT full_name, email INTO customer_name, customer_email
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = NEW.customer_id;
  
  -- Here you would integrate with an email service
  -- For now, we'll just log it (you'll need to implement actual email sending)
  RAISE NOTICE 'New conversation: Provider % should be notified. Customer: % (%)', 
    provider_email, customer_name, customer_email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new conversations
DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_new_conversation();

-- Create a table to store email notifications (queue)
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Function to queue email notification
CREATE OR REPLACE FUNCTION queue_provider_email()
RETURNS TRIGGER AS $$
DECLARE
  provider_email TEXT;
  customer_name TEXT;
  conversation_url TEXT;
BEGIN
  -- Get provider email
  SELECT u.email INTO provider_email
  FROM auth.users u
  WHERE u.id = NEW.provider_id;
  
  -- Get customer name
  SELECT COALESCE(p.full_name, u.email) INTO customer_name
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = NEW.customer_id;
  
  -- Create conversation URL (production domain)
  conversation_url := 'https://nexus-onti.shop/chat?conversation=' || NEW.id;
  
  -- Queue email notification
  INSERT INTO email_notifications (to_email, subject, body, conversation_id)
  VALUES (
    provider_email,
    'Nueva conversación - ' || customer_name,
    'Hola,' || E'\n\n' ||
    'Tienes una nueva conversación de ' || customer_name || '.' || E'\n\n' ||
    'Accede al chat aquí: ' || conversation_url || E'\n\n' ||
    'Saludos,' || E'\n' ||
    'NEXUS Team',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger with the new one
DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION queue_provider_email();
