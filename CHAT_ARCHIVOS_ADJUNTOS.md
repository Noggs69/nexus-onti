# 📎 Sistema de Archivos Adjuntos en Chat

## Descripción

Se ha implementado un sistema completo para compartir archivos multimedia en el chat de NEXUS. Los usuarios ahora pueden enviar imágenes, videos y documentos directamente en sus conversaciones.

## ✨ Características

### Tipos de Archivos Soportados

#### 📷 Imágenes
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

#### 🎥 Videos
- MP4
- MPEG
- MOV (QuickTime)
- WebM
- AVI

#### 📄 Documentos
- PDF
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)
- Texto (.txt)
- CSV
- Archivos comprimidos (.zip, .rar, .7z)

### Límites
- **Tamaño máximo:** 50 MB por archivo
- **Cantidad:** 1 archivo por mensaje (se puede extender a múltiples en el futuro)

## 🚀 Configuración Inicial

### 1. Ejecutar Migración de Base de Datos

```bash
# Desde la carpeta raíz del proyecto
node run-migration.js supabase/migrations/20260203_add_message_attachments.sql
```

### 2. Configurar Supabase Storage

```bash
# Ejecutar el script de configuración
node setup-chat-storage.js
```

### 3. Configurar Políticas RLS en Supabase

Accede al Dashboard de Supabase y ejecuta estas políticas manualmente:

#### Política de INSERT (subir archivos):
```sql
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Política de SELECT (ver archivos):
```sql
CREATE POLICY "Usuarios pueden ver archivos de sus conversaciones"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
);
```

#### Política de DELETE (eliminar archivos):
```sql
CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📝 Cómo Usar

### Para Usuarios

1. **Adjuntar Archivo:**
   - Haz clic en el botón del clip 📎 junto al campo de mensaje
   - Selecciona el archivo desde tu dispositivo
   - Verás una vista previa del archivo seleccionado

2. **Enviar Mensaje con Archivo:**
   - Opcionalmente, escribe un mensaje de texto
   - Haz clic en el botón de enviar
   - El archivo se subirá automáticamente

3. **Ver Archivos Adjuntos:**
   - **Imágenes:** Se muestran directamente en el chat (clic para ampliar)
   - **Videos:** Reproductor integrado con controles
   - **Documentos:** Enlace para descargar/abrir en nueva pestaña

### Para Desarrolladores

#### Estructura de la Base de Datos

**Tabla `messages`:**
```sql
- attachment_url: text (URL pública del archivo)
- attachment_type: 'image' | 'video' | 'document'
- attachment_name: text (nombre original)
- attachment_size: bigint (tamaño en bytes)
```

**Tabla `message_attachments` (para funcionalidad futura):**
- Soporte para múltiples archivos por mensaje
- Metadatos adicionales (MIME type, etc.)

#### API del Hook `useChat`

```typescript
const { messages, sendMessage, uploadFile, loading } = useMessages(conversationId);

// Subir archivo
const attachment = await uploadFile(file, userId);
// Retorna: { url, name, size, type }

// Enviar mensaje con archivo
await sendMessage(content, senderId, attachment);
```

#### Componente Chat

```typescript
// Estados relevantes
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [filePreview, setFilePreview] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);

// Funciones helper
formatFileSize(bytes: number): string
getFileIcon(file: File): JSX.Element
handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void
handleCancelFile(): void
```

## 🔒 Seguridad

### Almacenamiento
- Los archivos se almacenan en Supabase Storage
- Bucket público para lectura, autenticado para escritura
- Los archivos se organizan por usuario: `userId/timestamp-random.ext`

### Validaciones
- Tamaño máximo: 50MB (configurable)
- Tipos MIME permitidos (lista blanca)
- Validación en cliente y servidor

### Políticas RLS
- Los usuarios solo pueden subir archivos a su propia carpeta
- Todos los usuarios autenticados pueden ver archivos
- Los usuarios solo pueden eliminar sus propios archivos

## 🎨 UI/UX

### Botón de Adjuntar
- Icono de clip 📎
- Deshabilitado durante envío/subida
- Tooltip explicativo

### Preview de Archivo
- Vista previa para imágenes y videos
- Icono genérico para documentos
- Muestra nombre y tamaño del archivo
- Botón para cancelar selección

### Renderizado en Chat
- **Imágenes:** Thumbnail con lightbox al hacer clic
- **Videos:** Reproductor HTML5 con controles
- **Documentos:** Card con icono, nombre, tamaño y enlace de descarga

### Estados de Carga
- Indicador "Subiendo archivo..." durante upload
- Spinner en botón de enviar
- Deshabilitación de inputs durante proceso

## 🚧 Mejoras Futuras

### Corto Plazo
- [ ] Soporte para múltiples archivos por mensaje
- [ ] Arrastrar y soltar archivos (drag & drop)
- [ ] Copiar/pegar imágenes desde clipboard
- [ ] Compresión automática de imágenes grandes

### Mediano Plazo
- [ ] Galería de medios de la conversación
- [ ] Búsqueda de archivos compartidos
- [ ] Integración con Google Drive/Dropbox
- [ ] Edición básica de imágenes antes de enviar

### Largo Plazo
- [ ] Transcripción automática de videos
- [ ] OCR para extraer texto de imágenes
- [ ] Generación de thumbnails optimizados
- [ ] CDN para mejor rendimiento global

## 🐛 Troubleshooting

### Error: "El bucket no existe"
**Solución:** Ejecuta `node setup-chat-storage.js` para crear el bucket.

### Error: "Archivo demasiado grande"
**Solución:** El límite es 50MB. Considera comprimir el archivo o actualizar el límite en el código.

### Error: "Tipo de archivo no permitido"
**Solución:** Verifica que el tipo MIME esté en la lista de tipos permitidos en `setup-chat-storage.js`.

### Los archivos no se visualizan
**Solución:** Verifica que el bucket sea público o que las políticas RLS estén configuradas correctamente.

## 📞 Soporte

Para problemas o preguntas:
1. Revisa los logs del navegador (Console)
2. Verifica los logs de Supabase (Dashboard > Logs)
3. Comprueba que las políticas RLS estén activas
4. Verifica que el usuario esté autenticado correctamente

---

**Versión:** 1.0.0  
**Fecha:** 3 de febrero de 2026  
**Autor:** Sistema NEXUS
