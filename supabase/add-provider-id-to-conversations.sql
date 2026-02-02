-- Agregar campo provider_id a la tabla conversations

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);

-- Actualizar conversaciones existentes con un proveedor por defecto si existe
-- Esto asigna el primer proveedor disponible a conversaciones sin proveedor
UPDATE conversations 
SET provider_id = (
  SELECT id FROM profiles 
  WHERE role = 'provider' 
  LIMIT 1
)
WHERE provider_id IS NULL;
