-- ============================================
-- ASIGNAR ROLES A USUARIOS
-- ============================================
-- nacho.molla.pra@gmail.com = customer (cliente)
-- nachomolla6@gmail.com = provider (proveedor)

-- Actualizar rol de provider
UPDATE profiles 
SET role = 'provider'
WHERE email = 'nachomolla6@gmail.com';

-- Asegurar que el cliente tenga rol customer
UPDATE profiles 
SET role = 'customer'
WHERE email = 'nacho.molla.pra@gmail.com';

-- Verificar roles asignados
SELECT id, email, role 
FROM profiles 
WHERE email IN ('nachomolla6@gmail.com', 'nacho.molla.pra@gmail.com');
