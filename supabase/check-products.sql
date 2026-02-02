-- Verificar si existen productos en la base de datos
SELECT COUNT(*) as total_productos FROM products;

-- Ver todos los productos
SELECT id, name, slug, price, featured, created_at FROM products ORDER BY created_at DESC;

-- Ver todas las categorías
SELECT id, name, slug FROM categories;

-- Verificar políticas RLS de products
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('products', 'categories');
