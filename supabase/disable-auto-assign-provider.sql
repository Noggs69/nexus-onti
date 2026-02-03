-- Desactivar el trigger que asigna automáticamente proveedores
-- Este trigger interfiere con el sistema de cola compartida

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS assign_provider_to_conversation ON conversations;

-- Eliminar la función asociada
DROP FUNCTION IF EXISTS auto_assign_provider();

-- Nota: Las conversaciones ahora se crean con provider_id = NULL
-- y se asignan automáticamente cuando el proveedor envía su primer mensaje
