-- Permitir que los proveedores vean sus conversaciones asignadas

-- Agregar política para que proveedores vean conversaciones donde están asignados
CREATE POLICY "Providers see assigned conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Permitir que proveedores vean mensajes en sus conversaciones
CREATE POLICY "Providers see messages in assigned conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.provider_id = auth.uid()
    )
  );

-- Permitir que proveedores envíen mensajes en sus conversaciones
CREATE POLICY "Providers can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.provider_id = auth.uid()
    )
  );

-- Permitir que proveedores actualicen conversaciones
CREATE POLICY "Providers can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
