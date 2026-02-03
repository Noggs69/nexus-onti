/**
 * SOLUCIÓN DEFINITIVA - Ejecutar en la consola del navegador
 * 
 * Este script verifica la configuración y te dice exactamente qué hacer
 */

async function solucionarErrorRLS() {
  console.log('🔍 Diagnosticando problema de RLS...\n');

  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No estás autenticado');
    console.log('👉 Solución: Inicia sesión en la aplicación primero');
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  console.log('   User ID:', user.id, '\n');

  // 2. Verificar bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucket = buckets?.find(b => b.name === 'chat-files');
  
  if (!bucket) {
    console.error('❌ El bucket "chat-files" no existe');
    console.log('👉 Solución:');
    console.log('   1. Ve a Supabase Dashboard');
    console.log('   2. Storage > New bucket');
    console.log('   3. Nombre: chat-files');
    console.log('   4. Marca "Public bucket"');
    console.log('   5. Save');
    return;
  }
  
  console.log('✅ Bucket encontrado');
  console.log('   Público:', bucket.public, '\n');

  // 3. Test de subida real
  console.log('🧪 Probando subida de archivo...');
  const testFile = new File(['test content'], 'test.png', { type: 'image/png' });
  const fileName = `${user.id}/test-${Date.now()}.png`;
  
  const { data, error } = await supabase.storage
    .from('chat-files')
    .upload(fileName, testFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ ERROR:', error.message, '\n');
    
    if (error.message.includes('row-level security')) {
      console.log('🔧 SOLUCIÓN - Haz una de estas 3 opciones:\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('OPCIÓN 1: Marcar bucket como público (MÁS RÁPIDO)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Ve a: https://supabase.com/dashboard/project/_/storage/buckets');
      console.log('2. Click en "chat-files"');
      console.log('3. Click en pestaña "Configuration"');
      console.log('4. Marca la casilla "Public bucket"');
      console.log('5. Click "Save"');
      console.log('6. Recarga esta página y prueba de nuevo\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('OPCIÓN 2: Eliminar todas las políticas');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Ve a Storage > chat-files > Policies');
      console.log('2. Elimina TODAS las políticas existentes');
      console.log('3. Marca el bucket como público (Opción 1)');
      console.log('4. Recarga y prueba\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('OPCIÓN 3: Recrear el bucket desde cero');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Storage > chat-files > Settings > Delete bucket');
      console.log('2. Storage > New bucket');
      console.log('3. Nombre: chat-files');
      console.log('4. ☑ Public bucket');
      console.log('5. Save');
      console.log('6. Recarga y prueba\n');
    }
    
    return;
  }

  console.log('✅ ¡ÉXITO! El archivo se subió correctamente');
  console.log('   URL:', data.path);
  
  // Limpiar
  await supabase.storage.from('chat-files').remove([fileName]);
  console.log('✅ Archivo de prueba eliminado\n');
  
  console.log('═══════════════════════════════════════════════');
  console.log('✨ TODO FUNCIONA - Ya puedes subir archivos en el chat');
  console.log('═══════════════════════════════════════════════');
}

// Ejecutar diagnóstico
console.clear();
solucionarErrorRLS();
