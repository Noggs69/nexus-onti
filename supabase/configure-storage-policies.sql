-- Configurar políticas de Storage para product-videos

-- Permitir acceso público de lectura a product-videos
-- (los proveedores ya pueden subir por RLS de la tabla product_videos)

-- Primero, verificar si existen políticas y eliminarlas
DROP POLICY IF EXISTS "Public Access to product videos" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete product files" ON storage.objects;

-- Política de lectura pública para product-videos
CREATE POLICY "Public Access to product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = 'product-videos');

-- Política de inserción para proveedores
CREATE POLICY "Providers can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = 'product-videos'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'provider')
);

-- Política de eliminación para proveedores
CREATE POLICY "Providers can delete product files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = 'product-videos'
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'provider')
);
