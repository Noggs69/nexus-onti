-- Desactivar el trigger que asigna automáticamente proveedores
-- Este trigger interfiere con el sistema de cola compartida

-- Eliminar todos los triggers posibles que puedan existir
DROP TRIGGER IF EXISTS trigger_auto_assign_provider ON conversations;
DROP TRIGGER IF EXISTS assign_provider_to_conversation ON conversations;
DROP TRIGGER IF EXISTS auto_assign_provider_trigger ON conversations;

-- Eliminar la función asociada con CASCADE para eliminar dependencias
DROP FUNCTION IF EXISTS auto_assign_provider() CASCADE;

-- Nota: Las conversaciones ahora se crean con provider_id = NULL
-- Los proveedores deben hacer clic en "Tomar conversación" manualmente
