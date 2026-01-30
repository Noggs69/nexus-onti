-- ============================================
-- NEXUS E-COMMERCE - SCHEMA COMPLETO
-- Ejecutar todo este archivo en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. LIMPIAR TABLAS EXISTENTES (OPCIONAL)
-- ============================================
-- Descomentar estas líneas si quieres empezar desde cero

-- DROP TABLE IF EXISTS quote_items CASCADE;
-- DROP TABLE IF EXISTS quotes CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS conversations CASCADE;
-- DROP TABLE IF EXISTS email_notifications CASCADE;
-- DROP TABLE IF EXISTS cart_items CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 2. CATEGORÍAS Y PRODUCTOS
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  featured BOOLEAN DEFAULT false,
  specs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PERFILES DE USUARIO Y ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'provider')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 4. DIRECCIONES
-- ============================================

CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('billing', 'shipping')),
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ============================================
-- 5. CARRITO DE COMPRAS
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- ============================================
-- 6. ÓRDENES
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  billing_address_id UUID REFERENCES addresses(id),
  shipping_address_id UUID REFERENCES addresses(id),
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- 7. SISTEMA DE CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- 8. SISTEMA DE COTIZACIONES (QUOTES)
-- ============================================

CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  notes TEXT,
  payment_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_conversation ON quotes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);

-- ============================================
-- 9. NOTIFICACIONES POR EMAIL
-- ============================================

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_sent ON email_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON email_notifications(created_at DESC);

-- ============================================
-- 10. FUNCIÓN Y TRIGGER PARA EMAILS
-- ============================================

CREATE OR REPLACE FUNCTION queue_provider_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  provider_email TEXT;
  customer_name TEXT;
  conversation_url TEXT;
BEGIN
  -- Solo enviar email si hay un provider asignado
  IF NEW.provider_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener email del proveedor desde profiles
  SELECT p.email INTO provider_email
  FROM profiles p
  WHERE p.id = NEW.provider_id;
  
  -- Si no se encuentra email, salir
  IF provider_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener nombre del cliente
  SELECT COALESCE(p.full_name, p.email) INTO customer_name
  FROM profiles p
  WHERE p.id = NEW.customer_id;
  
  -- URL de la conversación (producción)
  conversation_url := 'https://nexus-onti.shop/chat?conversation=' || NEW.id;
  
  -- Encolar notificación por email
  INSERT INTO email_notifications (to_email, subject, body, conversation_id)
  VALUES (
    provider_email,
    'Nueva conversación - ' || customer_name,
    'Hola,' || E'\n\n' ||
    'Tienes una nueva conversación de ' || customer_name || '.' || E'\n\n' ||
    'Accede al chat aquí: ' || conversation_url || E'\n\n' ||
    'Saludos,' || E'\n' ||
    'NEXUS Team',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Crear trigger para notificaciones
DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION queue_provider_email();

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- POLÍTICAS: Addresses
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id);

-- POLÍTICAS: Cart Items
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id);

-- POLÍTICAS: Orders
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: Order Items
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- POLÍTICAS: Conversations
CREATE POLICY "Users can read their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "Customers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- POLÍTICAS: Messages
CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.customer_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.customer_id = auth.uid() OR conversations.provider_id = auth.uid())
    )
  );

-- POLÍTICAS: Quotes
CREATE POLICY "Users can read their quotes"
  ON quotes FOR SELECT
  USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = quotes.conversation_id 
      AND conversations.provider_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = quotes.conversation_id 
      AND conversations.provider_id = auth.uid()
    )
  );

-- POLÍTICAS: Quote Items
CREATE POLICY "Users can read quote items"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (
        quotes.customer_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM conversations
          WHERE conversations.id = quotes.conversation_id
          AND conversations.provider_id = auth.uid()
        )
      )
    )
  );

-- POLÍTICAS: Email Notifications (solo providers)
CREATE POLICY "Providers can read notifications"
  ON email_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'provider'
    )
  );

-- POLÍTICAS: Products (lectura pública, solo admin puede escribir)
CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- ============================================
-- 12. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'customer' -- Por defecto todos son customers
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 13. FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Aplicar trigger de updated_at a todas las tablas relevantes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. DATOS INICIALES (CATEGORÍAS Y PRODUCTOS)
-- ============================================

-- Insertar categorías
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Smartphones', 'smartphones', 'Dispositivos móviles de última generación', 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg'),
  ('Laptops', 'laptops', 'Computadoras portátiles potentes y elegantes', 'https://images.pexels.com/photos/18105/pexels-photo.jpg'),
  ('Tablets', 'tablets', 'Tablets versátiles para trabajo y entretenimiento', 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg'),
  ('Audio', 'audio', 'Auriculares y altavoces premium', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'),
  ('Accesorios', 'accessories', 'Complementos y accesorios tecnológicos', 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg')
ON CONFLICT (slug) DO NOTHING;

-- Insertar productos de ejemplo
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

-- ============================================
-- ✅ SCHEMA COMPLETO
-- ============================================
-- Ejecuta este archivo completo en Supabase SQL Editor
-- Todas las tablas, políticas, triggers y funciones estarán listas
-- Incluye 5 categorías y 6 productos de ejemplo
-- ============================================
