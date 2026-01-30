/*
  # Update Products to Audio Devices

  1. Changes
    - Delete existing sample products and categories
    - Add new categories for audio products and wearables
    - Insert new products: Airpods Pro 2, Airpods 4, Apple Watch Ultra 8, Apple Watch Serie 11, JBL Xtreme 4
    - Add detailed specs and images for each product

  2. Products Added
    - Airpods Pro 2: Premium wireless earbuds with ANC
    - Airpods 4: Standard wireless earbuds
    - Apple Watch Ultra 8: Sports smartwatch
    - Apple Watch Serie 11: Standard smartwatch
    - JBL Xtreme 4: Portable Bluetooth speaker

  3. Categories
    - Wireless Earbuds
    - Smartwatches
    - Portable Speakers
*/

-- Delete existing products and categories to start fresh
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM categories;

-- Insert new categories
INSERT INTO categories (name, slug, description, image_url) VALUES
  (
    'Wireless Earbuds',
    'wireless-earbuds',
    'Auriculares inalámbricos premium con cancelación de ruido',
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'
  ),
  (
    'Smartwatches',
    'smartwatches',
    'Relojes inteligentes con conectividad y monitoreo de salud',
    'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg'
  ),
  (
    'Portable Speakers',
    'portable-speakers',
    'Altavoces portátiles de alta potencia',
    'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg'
  );

-- Insert new products
INSERT INTO products (name, slug, description, price, image_url, category_id, featured, specs) VALUES
  (
    'AirPods Pro 2',
    'airpods-pro-2',
    'Los auriculares inalámbricos más avanzados. Con cancelación de ruido adaptativa, audio envolvente personalizado y batería de larga duración.',
    249.99,
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
    (SELECT id FROM categories WHERE slug = 'wireless-earbuds'),
    true,
    '{
      "modelo": "AirPods Pro 2ª generación",
      "conectividad": "Bluetooth 5.3 + H2 chip",
      "anc": "Cancelación adaptativa de ruido",
      "bateria": "6h por carga (30h con estuche)",
      "resistencia": "IPX4",
      "caracteristicas": ["Audio envolvente", "Detección de conversación", "Aislamiento personalizado"],
      "peso": "4.3g por auricular"
    }'
  ),
  (
    'AirPods 4',
    'airpods-4',
    'Auriculares inalámbricos con diseño cómodo y características de audio inteligentes. Perfectos para el uso diario con sonido claro y conectividad seamless.',
    129.99,
    'https://images.pexels.com/photos/3808517/pexels-photo-3808517.jpeg',
    (SELECT id FROM categories WHERE slug = 'wireless-earbuds'),
    true,
    '{
      "modelo": "AirPods 4ª generación",
      "conectividad": "Bluetooth 5.3",
      "bateria": "5h por carga (24h con estuche)",
      "resistencia": "IPX4",
      "caracteristicas": ["Diseño ligero y cómodo", "Sensor de proximidad", "Controles táctiles"],
      "peso": "3.2g por auricular"
    }'
  ),
  (
    'Apple Watch Ultra 8',
    'apple-watch-ultra-8',
    'El reloj inteligente más resistente y versátil. Diseñado para aventureros con pantalla Always-On, monitoreo avanzado de salud y GPS de doble frecuencia.',
    799.99,
    'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
    (SELECT id FROM categories WHERE slug = 'smartwatches'),
    true,
    '{
      "modelo": "Apple Watch Ultra 8",
      "pantalla": "49mm Retina LTPO OLED",
      "procesador": "S8 chip",
      "bateria": "36h (uso normal) / 72h en modo bajo consumo",
      "resistencia": "Titanio, resistente al agua hasta 100m",
      "caracteristicas": ["Botón de acción programable", "GPS dual (L1+L5)", "Altímetro barométrico", "Sirena de emergencia", "Buceo"],
      "peso": "51g"
    }'
  ),
  (
    'Apple Watch Series 11',
    'apple-watch-series-11',
    'Tu compañero de salud y fitness. Con monitoreo inteligente de actividad, detección de caídas y notificaciones importantes en tu muñeca.',
    399.99,
    'https://images.pexels.com/photos/825949/pexels-photo-825949.jpeg',
    (SELECT id FROM categories WHERE slug = 'smartwatches'),
    true,
    '{
      "modelo": "Apple Watch Series 11",
      "pantalla": "41mm/45mm Retina LTPO OLED",
      "procesador": "S11 chip",
      "bateria": "18h (uso normal)",
      "resistencia": "Aluminio / Acero inoxidable, resistente al agua hasta 50m",
      "caracteristicas": ["ECG", "Oxígeno en sangre", "Detección de caídas", "SOS de emergencia", "Ritmo cardíaco"],
      "peso": "38-48g"
    }'
  ),
  (
    'JBL Xtreme 4',
    'jbl-xtreme-4',
    'Altavoz portátil extremadamente robusto con sonido potente de 360°. Resistente al agua y a prueba de golpes, ideal para aventuras.',
    399.99,
    'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg',
    (SELECT id FROM categories WHERE slug = 'portable-speakers'),
    true,
    '{
      "modelo": "JBL Xtreme 4",
      "potencia": "100W",
      "conectividad": "Bluetooth 5.1",
      "bateria": "24h",
      "resistencia": "IP67 (sumergible hasta 1m por 30min)",
      "caracteristicas": ["Sonido 360°", "Bass Boost", "JBL PartyBoost", "Manos libres", "Correa de transporte"],
      "peso": "1300g",
      "dimensiones": "350x142x142mm"
    }'
  );
