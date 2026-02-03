-- Arreglar políticas RLS para que proveedores vean TODAS las conversaciones
-- incluyendo las que tienen provider_id = NULL

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Providers can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Providers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "providers_view_conversations" ON conversations;

-- Crear nueva política para proveedores
CREATE POLICY "Providers can view all conversations including unassigned"
ON conversations
FOR SELECT
TO authenticated
USING (
  -- Si el usuario es proveedor, puede ver:
  -- 1. Conversaciones sin asignar (provider_id IS NULL)
  -- 2. Conversaciones asignadas a él
  -- 3. Conversaciones asignadas a otros (para ver que están tomadas)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
  OR
  -- Si es cliente, solo ve sus propias conversaciones
  customer_id = auth.uid()
);

-- Política para UPDATE (solo el proveedor asignado o sin asignar pueden actualizar)
DROP POLICY IF EXISTS "Providers can update conversations" ON conversations;
DROP POLICY IF EXISTS "Providers can update their conversations" ON conversations;
DROP POLICY IF EXISTS "providers_update_conversations" ON conversations;

CREATE POLICY "Providers can update their conversations"
ON conversations
FOR UPDATE
TO authenticated
USING (
  -- Proveedor puede actualizar si es suya o si está sin asignar (para tomarla)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
  AND (provider_id = auth.uid() OR provider_id IS NULL)
);

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'conversations';
