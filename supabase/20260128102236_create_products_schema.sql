/*
  # E-commerce Products Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `category_id` (uuid, foreign key)
      - `featured` (boolean)
      - `specs` (jsonb) - for product specifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `image_url` (text)
      - `position` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (since this is an e-commerce site)
    - Products and categories are publicly viewable
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  image_url text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  featured boolean DEFAULT false,
  specs jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Categories are publicly viewable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Products are publicly viewable"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Product images are publicly viewable"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Smartphones', 'smartphones', 'Dispositivos móviles de última generación', 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg'),
  ('Laptops', 'laptops', 'Computadoras portátiles potentes y elegantes', 'https://images.pexels.com/photos/18105/pexels-photo.jpg'),
  ('Tablets', 'tablets', 'Tablets versátiles para trabajo y entretenimiento', 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg'),
  ('Audio', 'audio', 'Auriculares y altavoces premium', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'),
  ('Accesorios', 'accessories', 'Complementos y accesorios tecnológicos', 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, image_url, category_id, featured, specs) VALUES
  (
    'Nexus Pro X1',
    'nexus-pro-x1',
    'El smartphone definitivo con pantalla OLED de 6.7", procesador de última generación y cámara de 108MP',
    999.99,
    'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg',
    (SELECT id FROM categories WHERE slug = 'smartphones'),
    true,
    '{"pantalla": "6.7\" OLED", "procesador": "Octa-core 3.2GHz", "camara": "108MP + 12MP + 12MP", "bateria": "5000mAh", "almacenamiento": "256GB"}'
  ),
  (
    'UltraBook Elite',
    'ultrabook-elite',
    'Laptop ultradelgada con procesador de 12 núcleos, 16GB RAM y pantalla 4K táctil',
    1899.99,
    'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg',
    (SELECT id FROM categories WHERE slug = 'laptops'),
    true,
    '{"pantalla": "15.6\" 4K Touch", "procesador": "Intel i9 12-core", "ram": "16GB DDR5", "almacenamiento": "1TB SSD", "grafica": "RTX 4060"}'
  ),
  (
    'Canvas Tablet Pro',
    'canvas-tablet-pro',
    'Tablet profesional de 12.9" perfecta para creativos, con stylus incluido',
    799.99,
    'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg',
    (SELECT id FROM categories WHERE slug = 'tablets'),
    true,
    '{"pantalla": "12.9\" Liquid Retina", "procesador": "M2 chip", "ram": "8GB", "almacenamiento": "256GB", "extras": "Stylus incluido"}'
  ),
  (
    'SoundWave Ultra',
    'soundwave-ultra',
    'Auriculares inalámbricos con cancelación de ruido activa y audio Hi-Fi',
    299.99,
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
    (SELECT id FROM categories WHERE slug = 'audio'),
    true,
    '{"tipo": "Over-ear", "conectividad": "Bluetooth 5.3", "bateria": "30h", "caracteristicas": "ANC, Hi-Res Audio"}'
  ),
  (
    'Nexus Lite',
    'nexus-lite',
    'Smartphone accesible con gran batería y cámara versátil',
    499.99,
    'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg',
    (SELECT id FROM categories WHERE slug = 'smartphones'),
    false,
    '{"pantalla": "6.4\" AMOLED", "procesador": "Octa-core 2.4GHz", "camara": "64MP + 8MP", "bateria": "5500mAh"}'
  ),
  (
    'WorkStation Pro',
    'workstation-pro',
    'Laptop potente para profesionales y creadores de contenido',
    2499.99,
    'https://images.pexels.com/photos/238118/pexels-photo-238118.jpeg',
    (SELECT id FROM categories WHERE slug = 'laptops'),
    false,
    '{"pantalla": "16\" 4K", "procesador": "Intel i9", "ram": "32GB", "almacenamiento": "2TB SSD", "grafica": "RTX 4080"}'
  )
ON CONFLICT (slug) DO NOTHING;