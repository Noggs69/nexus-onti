-- Crear usuario de prueba directamente en la base de datos
-- IMPORTANTE: Esto es solo para desarrollo, no uses esto en producción

-- Primero necesitas el UUID del usuario de auth.users
-- Ve a Supabase Dashboard → Authentication → Users y copia el UUID

-- Ejemplo: Crear perfil para un usuario que ya existe en auth.users
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Reemplaza con el UUID real del usuario
  'cliente@ejemplo.com',
  'Cliente de Prueba',
  'customer'
)
ON CONFLICT (id) DO NOTHING;

-- Para verificar los usuarios existentes
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
