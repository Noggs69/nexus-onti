-- ============================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS
-- ============================================
-- Opción 1: Usar imágenes locales (después de colocarlas en public/products/)
-- Opción 2: Usar URLs de internet

-- OPCIÓN 1: Imágenes locales (recomendado)
-- Descomentar después de colocar las imágenes en public/products/

/*
UPDATE products SET image_url = '/products/nexus-pro-x1.jpg' WHERE slug = 'nexus-pro-x1';
UPDATE products SET image_url = '/products/ultrabook-elite.jpg' WHERE slug = 'ultrabook-elite';
UPDATE products SET image_url = '/products/canvas-tablet-pro.jpg' WHERE slug = 'canvas-tablet-pro';
UPDATE products SET image_url = '/products/soundwave-ultra.jpg' WHERE slug = 'soundwave-ultra';
UPDATE products SET image_url = '/products/nexus-lite.jpg' WHERE slug = 'nexus-lite';
UPDATE products SET image_url = '/products/workstation-pro.jpg' WHERE slug = 'workstation-pro';
*/

-- OPCIÓN 2: URLs de internet (si prefieres usar enlaces externos)
-- Pega aquí las URLs y ejecuta:

/*
UPDATE products SET image_url = 'https://tu-url-1.jpg' WHERE slug = 'nexus-pro-x1';
UPDATE products SET image_url = 'https://tu-url-2.jpg' WHERE slug = 'ultrabook-elite';
UPDATE products SET image_url = 'https://tu-url-3.jpg' WHERE slug = 'canvas-tablet-pro';
UPDATE products SET image_url = 'https://tu-url-4.jpg' WHERE slug = 'soundwave-ultra';
UPDATE products SET image_url = 'https://tu-url-5.jpg' WHERE slug = 'nexus-lite';
UPDATE products SET image_url = 'https://tu-url-6.jpg' WHERE slug = 'workstation-pro';
*/

-- Verificar las imágenes actuales
SELECT slug, name, image_url FROM products ORDER BY slug;
