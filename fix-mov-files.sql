-- ====================================================================
-- Corregir archivos .MOV y otros videos que no se detectaron bien
-- ====================================================================
-- Ejecuta esto en Supabase SQL Editor
-- ====================================================================

-- 1. Ver qué archivos tienen problema (antes de corregir)
SELECT 
  id,
  content,
  attachment_url,
  attachment_type,
  attachment_name,
  created_at
FROM messages
WHERE attachment_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 2. Corregir el tipo de archivo basado en la extensión
UPDATE messages
SET attachment_type = CASE
  -- Videos
  WHEN LOWER(attachment_url) LIKE '%.mp4%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.mov%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.webm%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.avi%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.mkv%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.m4v%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.3gp%' THEN 'video'
  WHEN LOWER(attachment_url) LIKE '%.flv%' THEN 'video'
  
  -- Imágenes
  WHEN LOWER(attachment_url) LIKE '%.jpg%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.jpeg%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.png%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.gif%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.webp%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.svg%' THEN 'image'
  WHEN LOWER(attachment_url) LIKE '%.bmp%' THEN 'image'
  
  -- Documentos (fallback)
  ELSE 'document'
END
WHERE attachment_url IS NOT NULL;

-- 3. Verificar que se corrigieron correctamente
SELECT 
  attachment_type,
  COUNT(*) as cantidad,
  STRING_AGG(DISTINCT SUBSTRING(attachment_url FROM '[^/]+$'), ', ') as ejemplos
FROM messages
WHERE attachment_url IS NOT NULL
GROUP BY attachment_type;

-- 4. Ver los archivos .MOV específicamente
SELECT 
  id,
  content,
  attachment_type,
  attachment_name,
  attachment_url,
  created_at
FROM messages
WHERE attachment_url LIKE '%.mov%' OR attachment_url LIKE '%.MOV%'
ORDER BY created_at DESC;
