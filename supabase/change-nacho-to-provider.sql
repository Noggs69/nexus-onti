-- Cambiar ambos correos a proveedores
UPDATE profiles 
SET role = 'provider' 
WHERE email IN ('nacho.molla.pra@gmail.com', 'kalbito06@gmail.com');

-- Verificar el cambio
SELECT id, email, role FROM profiles WHERE email IN ('nacho.molla.pra@gmail.com', 'kalbito06@gmail.com') ORDER BY email;
