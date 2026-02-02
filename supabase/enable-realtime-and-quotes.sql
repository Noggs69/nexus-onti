-- ============================================
-- SCRIPT COMPLETO: Activar Realtime + Políticas de Cotizaciones
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para:
-- 1. Activar Realtime en las tablas necesarias
-- 2. Configurar políticas RLS para quotes y quote_items
-- 3. Configurar roles de proveedores

-- ============================================
-- PARTE 1: ACTIVAR REALTIME Y CREAR TABLA TYPING_STATUS
-- ============================================

-- Primero, crear tabla typing_status si no existe
CREATE TABLE IF NOT EXISTS typing_status (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Habilitar RLS en typing_status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Políticas para typing_status
DROP POLICY IF EXISTS "Users see typing status in their conversations" ON typing_status;
CREATE POLICY "Users see typing status in their conversations"
  ON typing_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = typing_status.conversation_id
      AND (conversations.customer_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their typing status" ON typing_status;
CREATE POLICY "Users can update their typing status"
  ON typing_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can modify their typing status" ON typing_status;
CREATE POLICY "Users can modify their typing status"
  ON typing_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agregar campos de lectura a messages si no existen
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS read_by uuid REFERENCES auth.users(id);

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_reader_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET read_at = now(),
      read_by = p_reader_id
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_reader_id
    AND read_at IS NULL;
END;
$$;

-- Activar replicación realtime para mensajes instantáneos
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages ya está en supabase_realtime';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'conversations ya está en supabase_realtime';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'typing_status ya está en supabase_realtime';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'quotes ya está en supabase_realtime';
  END;
END $$;

-- ============================================
-- PARTE 2: CONFIGURAR ROLES DE PROVEEDORES
-- ============================================

-- Cambiar ambos correos a proveedores
UPDATE profiles 
SET role = 'provider' 
WHERE email IN ('nacho.molla.pra@gmail.com', 'kalbito06@gmail.com');

-- ============================================
-- PARTE 3: POLÍTICAS RLS PARA QUOTES
-- ============================================

-- Eliminar TODAS las políticas existentes de quotes
DROP POLICY IF EXISTS "Customers create quotes" ON quotes;
DROP POLICY IF EXISTS "Customers see own quotes" ON quotes;
DROP POLICY IF EXISTS "Providers can create quotes" ON quotes;
DROP POLICY IF EXISTS "Providers see all quotes" ON quotes;
DROP POLICY IF EXISTS "Customers see their quotes" ON quotes;

-- Solo proveedores pueden crear cotizaciones
CREATE POLICY "Providers can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Proveedores ven todas las cotizaciones
CREATE POLICY "Providers see all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Clientes ven solo sus cotizaciones
CREATE POLICY "Customers see their quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
  );

-- ============================================
-- PARTE 4: POLÍTICAS RLS PARA QUOTE_ITEMS
-- ============================================

-- Eliminar TODAS las políticas existentes de quote_items
DROP POLICY IF EXISTS "Customers see quote items" ON quote_items;
DROP POLICY IF EXISTS "Providers see all quote items" ON quote_items;
DROP POLICY IF EXISTS "Customers see their quote items" ON quote_items;
DROP POLICY IF EXISTS "Providers can create quote items" ON quote_items;

-- Proveedores ven todos los items
CREATE POLICY "Providers see all quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- Clientes ven items de sus cotizaciones
CREATE POLICY "Customers see their quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_id
      AND quotes.customer_id = auth.uid()
    )
  );

-- IMPORTANTE: Proveedores pueden insertar items de cotización
CREATE POLICY "Providers can create quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar proveedores
SELECT id, email, role FROM profiles 
WHERE email IN ('nacho.molla.pra@gmail.com', 'kalbito06@gmail.com');

-- Verificar políticas de quotes
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('quotes', 'quote_items')
ORDER BY tablename, policyname;
