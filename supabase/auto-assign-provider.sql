-- ============================================
-- AUTO-ASIGNAR PROVEEDOR A CONVERSACIONES
-- ============================================
-- Cuando un cliente crea una conversación sin proveedor,
-- automáticamente asignar a nachomolla6@gmail.com

CREATE OR REPLACE FUNCTION auto_assign_provider()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  provider_user_id UUID;
BEGIN
  -- Si ya tiene provider asignado, no hacer nada
  IF NEW.provider_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar el ID del provider (nacho.molla.pra@gmail.com)
  SELECT id INTO provider_user_id
  FROM profiles
  WHERE email = 'nacho.molla.pra@gmail.com'
  AND role = 'provider'
  LIMIT 1;
  
  -- Si existe el provider, asignarlo
  IF provider_user_id IS NOT NULL THEN
    NEW.provider_id := provider_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger BEFORE INSERT para asignar provider automáticamente
DROP TRIGGER IF EXISTS trigger_auto_assign_provider ON conversations;
CREATE TRIGGER trigger_auto_assign_provider
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_provider();

-- Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'conversations'
AND trigger_name = 'trigger_auto_assign_provider';
