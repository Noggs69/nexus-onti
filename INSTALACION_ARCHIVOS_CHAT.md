# 🚀 Instrucciones de Instalación Rápida - Archivos en Chat

## ⚡ Solución Rápida al Error de RLS

Si obtienes el error **"new row violates row-level security policy"**, sigue estos pasos:

### Opción 1: Políticas Simples (Recomendado para empezar)

Ve a **Storage > chat-files > Configuration > Policies** y crea:

**Política INSERT:**
- Nombre: `Allow authenticated uploads`
- Para: `INSERT`
- Expresión: `bucket_id = 'chat-files'`

**Política SELECT:**
- Nombre: `Allow authenticated reads`
- Para: `SELECT`  
- Expresión: `bucket_id = 'chat-files'`

### Opción 2: Bucket Público (Más Simple)

Si las políticas no funcionan:
1. Ve a **Storage > chat-files > Configuration**
2. Marca la opción **"Public bucket"**
3. Guarda los cambios

---

## Paso 1: Ejecutar Migración de Base de Datos

Copia y pega este SQL en el **SQL Editor** de tu Dashboard de Supabase:

```sql
-- Agregar soporte para archivos multimedia en mensajes

-- 1. Agregar columnas para archivos a la tabla messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'video', 'document', NULL)),
ADD COLUMN IF NOT EXISTS attachment_name text,
ADD COLUMN IF NOT EXISTS attachment_size bigint;

-- 2. Crear tabla de adjuntos para soporte multi-archivo (opcional para futuro)
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS para message_attachments
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad para message_attachments
CREATE POLICY "Users see attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_attachments.message_id
      AND (c.customer_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.customer_id = auth.uid() OR c.provider_id = auth.uid())
      AND m.sender_id = auth.uid()
    )
  );

-- 5. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_attachment_type ON messages(attachment_type) WHERE attachment_type IS NOT NULL;
```

## Paso 2: Configurar Supabase Storage

### 2.1. Crear el Bucket

Ve a **Dashboard > Storage** y:

1. Haz clic en "New bucket"
2. Nombre: `chat-files`
3. Marcar como **Public bucket** ✓
4. Configurar tamaño máximo: 50 MB
5. Hacer clic en "Create bucket"

### 2.2. Configurar Políticas RLS del Bucket

Ve a **Dashboard > Storage > chat-files > Policies** y crea estas 3 políticas:

#### ✅ Política 1: INSERT (Subir archivos)

**Nombre:** `Allow authenticated users to upload files`

```sql
bucket_id = 'chat-files' AND auth.role() = 'authenticated'
```

O si quieres que solo suban a su carpeta de usuario:
```sql
bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### ✅ Política 2: SELECT (Ver archivos)

**Nombre:** `Allow authenticated users to view files`

```sql
bucket_id = 'chat-files' AND auth.role() = 'authenticated'
```

#### ✅ Política 3: DELETE (Eliminar archivos)

**Nombre:** `Allow users to delete their own files`

```sql
bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text
```

### 📝 Cómo Crear las Políticas en Supabase

1. Ve a **Storage > chat-files > Configuration > Policies**
2. Haz clic en **"New Policy"**
3. Selecciona la operación (INSERT, SELECT o DELETE)
4. Marca **"Provide using a custom expression"**
5. Copia y pega la expresión SQL de arriba
6. Haz clic en **"Save Policy"**
7. Repite para las 3 políticas

### 2.3. Configurar MIME Types (Opcional pero Recomendado)

En la configuración del bucket, puedes limitar los tipos de archivo permitidos agregando esta lista en "Allowed MIME types":

```
image/jpeg
image/jpg
image/png
image/gif
image/webp
image/svg+xml
video/mp4
video/mpeg
video/quicktime
video/webm
video/x-msvideo
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
application/vnd.ms-powerpoint
application/vnd.openxmlformats-officedocument.presentationml.presentation
text/plain
text/csv
application/zip
application/x-rar-compressed
application/x-7z-compressed
```

## Paso 3: ¡Listo para Usar!

Reinicia tu aplicación y la funcionalidad de archivos adjuntos estará disponible:

1. Abre el chat
2. Haz clic en el icono del clip 📎
3. Selecciona un archivo
4. Envía el mensaje

## 🧪 Probar la Funcionalidad

1. **Imagen:** Sube un JPG o PNG - debería verse inline
2. **Video:** Sube un MP4 - debería tener controles de reproducción
3. **Documento:** Sube un PDF - debería aparecer un enlace de descarga

## ⚠️ Troubleshooting

### ❌ Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS del bucket no están configuradas correctamente.

**Solución Rápida:**
1. Ve a **Storage > chat-files > Configuration**
2. Desmarca todas las políticas existentes (o elimínalas)
3. Crea solo estas 2 políticas simples:

**Política INSERT (Subir):**
```sql
bucket_id = 'chat-files'
```

**Política SELECT (Ver):**
```sql
bucket_id = 'chat-files'
```

4. **O simplemente marca el bucket como público** en Configuration

**Verificación:**
- Abre la consola del navegador (F12)
- Intenta subir un archivo
- Si ves el error, revisa que las políticas estén activas en Supabase

### Error: "Bucket not found"
- Asegúrate de haber creado el bucket `chat-files` en Storage
- Verifica el nombre exacto (distingue mayúsculas/minúsculas)

### Error: "Policy violation" o "403 Forbidden"
- Elimina todas las políticas RLS existentes
- Crea las políticas simples de arriba
- O marca el bucket como público
- Verifica que el usuario esté autenticado (auth.uid() debe existir)

### Los archivos no se ven
- Confirma que el bucket sea **público** para lectura
- Verifica la URL del archivo en la consola
- Comprueba que attachment_url esté guardándose en la base de datos

### No puedo subir archivos
- Revisa que el tamaño sea menor a 50MB
- Verifica que el tipo de archivo esté permitido
- Comprueba la consola por errores específicos
- Asegúrate de estar autenticado

### El botón de clip no aparece
- Verifica que el componente Chat esté actualizado
- Revisa la consola por errores de TypeScript
- Asegúrate de que los iconos de lucide-react estén importados

---

## 🔬 Herramienta de Diagnóstico

Si tienes problemas, ejecuta este script de verificación:

1. Abre tu aplicación en el navegador
2. Abre la consola (F12)
3. Copia y pega el contenido de `verificar-storage.js`
4. Presiona Enter
5. Revisa el diagnóstico automático

O sigue la guía detallada en [SOLUCION_ERROR_RLS_STORAGE.md](./SOLUCION_ERROR_RLS_STORAGE.md)

---

✅ **Configuración completada** - Ahora puedes compartir fotos, videos y documentos en tus conversaciones.

**Documentos relacionados:**
- [CHAT_ARCHIVOS_ADJUNTOS.md](./CHAT_ARCHIVOS_ADJUNTOS.md) - Documentación completa
- [SOLUCION_ERROR_RLS_STORAGE.md](./SOLUCION_ERROR_RLS_STORAGE.md) - Solución de errores RLS
- [RESUMEN_ARCHIVOS_CHAT.md](./RESUMEN_ARCHIVOS_CHAT.md) - Resumen técnico
