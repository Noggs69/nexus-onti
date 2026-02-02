-- Agregar campos para mensajes en tiempo real

-- Agregar campos de lectura a la tabla messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS read_by uuid REFERENCES auth.users(id);

-- Crear tabla para tracking de "typing" (estado de escribiendo)
CREATE TABLE IF NOT EXISTS typing_status (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Habilitar RLS en typing_status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean el estado de typing en sus conversaciones
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

-- Política para que usuarios actualicen su propio estado de typing
CREATE POLICY "Users can update their typing status"
  ON typing_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their typing status"
  ON typing_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read ON messages(conversation_id, read_at);
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation ON typing_status(conversation_id, updated_at);
