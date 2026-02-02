-- Verificar si hay proveedores en la tabla profiles
SELECT id, email, role, created_at
FROM profiles
WHERE role = 'provider';

-- Si no hay proveedores, ver todos los usuarios
SELECT id, email, role, created_at
FROM profiles
ORDER BY created_at DESC;
