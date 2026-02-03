/**
 * Script para configurar el bucket de almacenamiento para archivos del chat
 * Ejecutar este script una sola vez para crear el bucket
 * 
 * ANTES DE EJECUTAR:
 * Configura estas variables con tus credenciales de Supabase
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ CONFIGURACIÓN REQUERIDA
// Reemplaza estos valores con tus credenciales de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL_AQUI';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_KEY_AQUI';

if (supabaseUrl.includes('TU_SUPABASE') || supabaseServiceKey.includes('TU_SUPABASE')) {
  console.error('\n❌ Error: Debes configurar las credenciales de Supabase en el script');
  console.error('   O configurar las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChatStorage() {
  try {
    console.log('🚀 Configurando almacenamiento para archivos del chat...');

    // 1. Crear bucket para archivos del chat (público para lectura)
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .createBucket('chat-files', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          // Imágenes
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          // Videos
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/webm',
          'video/x-msvideo',
          // Documentos
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          // Archivos comprimidos
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
        ]
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ El bucket "chat-files" ya existe');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket "chat-files" creado exitosamente');
    }

    // 2. Actualizar políticas de acceso del bucket
    // Nota: Las políticas RLS se configuran desde el panel de Supabase
    console.log('\n📋 Políticas de Storage a configurar en Supabase Dashboard:');
    console.log('\n1. Política de INSERT (subir archivos):');
    console.log(`
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
    `);

    console.log('\n2. Política de SELECT (ver archivos):');
    console.log(`
CREATE POLICY "Usuarios pueden ver archivos de sus conversaciones"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
);
    `);

    console.log('\n3. Política de DELETE (eliminar archivos):');
    console.log(`
CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
    `);

    console.log('\n✅ Configuración completada');
    console.log('\n⚠️  IMPORTANTE: Ejecuta las políticas RLS manualmente en el panel de Supabase');
    console.log('   Dashboard > Storage > chat-files > Policies');

  } catch (error) {
    console.error('❌ Error configurando almacenamiento:', error);
    throw error;
  }
}

// Ejecutar configuración
setupChatStorage()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
