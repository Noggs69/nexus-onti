-- ============================================
-- ACTUALIZAR PRODUCTOS CON IMÁGENES REALES
-- ============================================

-- Primero limpiar productos existentes
DELETE FROM products;

-- Limpiar y recrear categorías correctas
DELETE FROM categories;

-- Insertar categorías reales que coincidan con los productos
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Wireless Earbuds', 'audio', 'Auriculares inalámbricos premium', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'),
  ('Smartwatches', 'accessories', 'Relojes inteligentes y wearables', 'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg'),
  ('Portable Speakers', 'speakers', 'Altavoces Bluetooth portátiles', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg')
ON CONFLICT (slug) DO NOTHING;

-- Insertar productos reales con imágenes locales
INSERT INTO products (name, slug, description, price, image_url, category_id, featured, specs) VALUES
  (
    'AirPods Pro 2',
    'airpods-pro-2',
    'Auriculares inalámbricos con cancelación de ruido activa, audio espacial personalizado y hasta 6 horas de autonomía',
    35.00,
    '/products/Airpods-Pro-2.jpg',
    (SELECT id FROM categories WHERE slug = 'audio'),
    true,
    '{"tipo": "In-ear", "conectividad": "Bluetooth 5.3", "bateria": "6h + 30h estuche", "caracteristicas": "ANC, Audio Espacial, Resistencia al agua IPX4"}'
  ),
  (
    'AirPods 4',
    'airpods-gen-4',
    'Auriculares inalámbricos con nuevo diseño ergonómico, audio adaptativo y hasta 5 horas de reproducción',
    30.00,
    '/products/Airpods-Gen-4.jpg',
    (SELECT id FROM categories WHERE slug = 'audio'),
    true,
    '{"tipo": "In-ear", "conectividad": "Bluetooth 5.3", "bateria": "5h + 24h estuche", "caracteristicas": "Audio Adaptativo, Control por gestos"}'
  ),
  (
    'Apple Watch Series 11',
    'apple-watch-s11',
    'Smartwatch avanzado con pantalla Retina siempre activa, sensores de salud y GPS integrado',
    120.00,
    '/products/Apple-Watch-S11.jfif',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    true,
    '{"pantalla": "1.9\" Retina LTPO", "sensores": "ECG, SpO2, Temperatura", "bateria": "18h", "resistencia": "WR50, IP6X"}'
  ),
  (
    'Appel Watch Ultra 8',
    'apple-watch-u8',
    'Reloj inteligente deportivo con monitor de frecuencia cardíaca, múltiples modos deportivos y gran autonomía',
    130.00,
    '/products/Applw-Watch-U8.jfif',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    false,
    '{"pantalla": "1.4\" TFT", "sensores": "Frecuencia cardíaca, Podómetro", "bateria": "7 días", "resistencia": "IP68"}'
  ),
  (
    'JBL Xtreme 4',
    'jbl-xtreme-4',
    'Altavoz Bluetooth portátil con sonido potente, resistente al agua y hasta 24 horas de reproducción',
    110.00,
    '/products/JBL-Xtreme-4.jpg',
    (SELECT id FROM categories WHERE slug = 'speakers'),
    true,
    '{"tipo": "Altavoz portátil", "potencia": "100W", "bateria": "24h", "resistencia": "IP67", "caracteristicas": "PartyBoost, PowerBank USB"}'
  )
ON CONFLICT (slug) DO NOTHING;

-- Verificar productos actualizados
SELECT slug, name, price, image_url, featured FROM products ORDER BY featured DESC, name;
