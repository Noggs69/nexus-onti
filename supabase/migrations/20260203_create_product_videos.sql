-- Crear tabla para almacenar videos privados de productos
CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_name TEXT NOT NULL,
  video_size INTEGER NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por producto
CREATE INDEX idx_product_videos_product_id ON product_videos(product_id);

-- RLS: Solo proveedores pueden ver y gestionar videos
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

-- Proveedores pueden ver todos los videos
CREATE POLICY "Providers can view all product videos"
ON product_videos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
);

-- Proveedores pueden insertar videos
CREATE POLICY "Providers can insert product videos"
ON product_videos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
);

-- Proveedores pueden actualizar videos
CREATE POLICY "Providers can update product videos"
ON product_videos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
);

-- Proveedores pueden eliminar videos
CREATE POLICY "Providers can delete product videos"
ON product_videos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'provider'
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_product_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_videos_updated_at
BEFORE UPDATE ON product_videos
FOR EACH ROW
EXECUTE FUNCTION update_product_videos_updated_at();
