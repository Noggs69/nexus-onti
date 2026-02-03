-- Agregar soporte para archivos multimedia en mensajes

-- 1. Agregar columnas para archivos a la tabla messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'video', 'document', NULL)),
ADD COLUMN IF NOT EXISTS attachment_name text,
ADD COLUMN IF NOT EXISTS attachment_size bigint;

-- 2. Crear bucket de almacenamiento para archivos del chat
-- Esto se hace desde la interfaz de Supabase o mediante código

-- 3. Crear tabla de adjuntos para soporte multi-archivo (opcional para futuro)
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

-- 4. Habilitar RLS para message_attachments
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad para message_attachments
CREATE POLICY "Users see attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_attachments.message_id
      AND (c.customer_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.customer_id = auth.uid() OR c.provider_id = auth.uid())
      AND m.sender_id = auth.uid()
    )
  );

-- 6. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_attachment_type ON messages(attachment_type) WHERE attachment_type IS NOT NULL;

-- 7. Comentarios para documentación
COMMENT ON COLUMN messages.attachment_url IS 'URL pública del archivo adjunto almacenado en Supabase Storage';
COMMENT ON COLUMN messages.attachment_type IS 'Tipo de archivo: image, video, document';
COMMENT ON COLUMN messages.attachment_name IS 'Nombre original del archivo';
COMMENT ON COLUMN messages.attachment_size IS 'Tamaño del archivo en bytes';
COMMENT ON TABLE message_attachments IS 'Tabla para múltiples adjuntos por mensaje (funcionalidad futura)';
