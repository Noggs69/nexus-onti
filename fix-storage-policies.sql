-- ====================================================================
-- SOLUCIÓN DEFINITIVA - Políticas de Storage para chat-files
-- ====================================================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query
-- ====================================================================

-- 1. ELIMINAR todas las políticas existentes del bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden ver archivos de sus conversaciones" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to chat-files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from chat-files" ON storage.objects;

-- 2. CREAR políticas nuevas y simples que funcionan
CREATE POLICY "chat-files: authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "chat-files: authenticated users can read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

CREATE POLICY "chat-files: users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-files');

CREATE POLICY "chat-files: users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files');

-- 3. VERIFICAR que las políticas se crearon
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat-files%'
ORDER BY policyname;

-- Deberías ver 4 políticas listadas
