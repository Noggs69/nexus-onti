-- ============================================
-- AÑADIR FUNCIONALIDADES AVANZADAS AL CHAT
-- Incluye: gestión de conversaciones, interacción con mensajes, seguridad
-- ============================================

-- 1. AÑADIR CAMPOS A LA TABLA CONVERSATIONS
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS temporary_messages_duration INTEGER; -- en horas, NULL = desactivado

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(pinned DESC, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived, last_message_at DESC);

-- 2. AÑADIR CAMPOS A LA TABLA MESSAGES
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('text', 'image', 'video', 'audio', 'file', 'product')),
  ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_media ON messages(conversation_id, media_type) WHERE media_type IS NOT NULL;

-- 3. CREAR TABLA DE REPORTES
CREATE TABLE IF NOT EXISTS conversation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_conversation ON conversation_reports(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON conversation_reports(status);

-- 4. CREAR TABLA DE BÚSQUEDA EN MENSAJES (para indexación full-text)
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('spanish', content));

-- 5. FUNCIÓN PARA ACTUALIZAR CONTADOR DE NO LEÍDOS
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contador para el otro participante
  UPDATE conversations
  SET unread_count = unread_count + 1,
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id
    AND (
      (customer_id != NEW.sender_id AND provider_id IS NULL) OR
      (provider_id != NEW.sender_id AND provider_id IS NOT NULL)
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contador cuando llega un nuevo mensaje
DROP TRIGGER IF EXISTS trigger_update_unread_count ON messages;
CREATE TRIGGER trigger_update_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- 6. FUNCIÓN PARA MARCAR CONVERSACIÓN COMO LEÍDA
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conv_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET unread_count = 0
  WHERE id = conv_id
    AND (customer_id = user_id OR provider_id = user_id);
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN PARA ELIMINAR MENSAJES TEMPORALES EXPIRADOS
CREATE OR REPLACE FUNCTION delete_expired_temporary_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages m
  USING conversations c
  WHERE m.conversation_id = c.id
    AND c.temporary_messages_duration IS NOT NULL
    AND m.created_at < NOW() - (c.temporary_messages_duration || ' hours')::interval;
END;
$$ LANGUAGE plpgsql;

-- 8. POLÍTICAS RLS PARA REPORTES
ALTER TABLE conversation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON conversation_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports"
  ON conversation_reports FOR SELECT
  USING (auth.uid() = reported_by);

-- 9. ACTUALIZAR POLÍTICAS PARA CONVERSACIONES BLOQUEADAS
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = customer_id OR auth.uid() = provider_id)
    AND (is_blocked = false OR blocked_by = auth.uid())
  );

-- Política para crear conversaciones: SOLO CLIENTES pueden iniciar conversaciones
DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
CREATE POLICY "Customers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
    )
  );

-- Añadir política para eliminar conversaciones
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;
CREATE POLICY "Users can delete their conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- 10. FUNCIÓN PARA BLOQUEAR/DESBLOQUEAR CONVERSACIÓN
CREATE OR REPLACE FUNCTION toggle_block_conversation(conv_id UUID, user_id UUID, block BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET is_blocked = block,
      blocked_by = CASE WHEN block THEN user_id ELSE NULL END
  WHERE id = conv_id
    AND (customer_id = user_id OR provider_id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Verificar cambios
SELECT 
  'conversations' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
  AND table_schema = 'public'
ORDER BY ordinal_position;
