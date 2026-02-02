-- Cambiar nacho.molla.pra@gmail.com de cliente a proveedor
UPDATE profiles 
SET role = 'provider' 
WHERE email = 'nacho.molla.pra@gmail.com';

-- Verificar el cambio
SELECT id, email, role FROM profiles WHERE email LIKE '%nacho%' ORDER BY email;
