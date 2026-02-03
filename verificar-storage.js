/**
 * Script para verificar la configuración de Storage y RLS
 * Ejecuta esto en la consola del navegador mientras estás en la aplicación
 */

async function verificarConfiguracionStorage() {
  console.log('🔍 Verificando configuración de Storage...\n');

  // 1. Verificar autenticación
  console.log('1️⃣ Verificando autenticación...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ ERROR: Usuario no autenticado');
    console.log('   Solución: Inicia sesión primero');
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  console.log('   User ID:', user.id);

  // 2. Verificar que el bucket existe
  console.log('\n2️⃣ Verificando bucket...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ ERROR al listar buckets:', bucketsError);
    return;
  }
  
  const chatFilesBucket = buckets.find(b => b.name === 'chat-files');
  
  if (!chatFilesBucket) {
    console.error('❌ ERROR: Bucket "chat-files" no encontrado');
    console.log('   Solución: Crea el bucket en Supabase Dashboard > Storage');
    return;
  }
  
  console.log('✅ Bucket encontrado:', chatFilesBucket.name);
  console.log('   Público:', chatFilesBucket.public);

  // 3. Test de subida
  console.log('\n3️⃣ Probando subida de archivo...');
  const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
  const fileName = `${user.id}/test-${Date.now()}.txt`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-files')
    .upload(fileName, testFile, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error('❌ ERROR al subir archivo:', uploadError);
    console.log('\n📋 Diagnóstico del error:');
    
    if (uploadError.message.includes('row-level security')) {
      console.log('   Problema: Políticas RLS incorrectas');
      console.log('   Solución 1: Ve a Storage > chat-files > Policies');
      console.log('   Solución 2: Crea política INSERT con:');
      console.log('              bucket_id = \'chat-files\'');
      console.log('   Solución 3: O marca el bucket como público');
    } else if (uploadError.message.includes('not found')) {
      console.log('   Problema: Bucket no encontrado o mal configurado');
    }
    return;
  }
  
  console.log('✅ Archivo subido exitosamente');
  console.log('   Path:', uploadData.path);

  // 4. Test de obtención de URL
  console.log('\n4️⃣ Obteniendo URL pública...');
  const { data: urlData } = supabase.storage
    .from('chat-files')
    .getPublicUrl(fileName);
  
  console.log('✅ URL pública generada:', urlData.publicUrl);

  // 5. Test de lectura
  console.log('\n5️⃣ Probando lectura de archivo...');
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('chat-files')
    .download(fileName);
  
  if (downloadError) {
    console.error('❌ ERROR al leer archivo:', downloadError);
    console.log('   Solución: Crea política SELECT con:');
    console.log('            bucket_id = \'chat-files\'');
    return;
  }
  
  console.log('✅ Archivo leído exitosamente');

  // 6. Limpieza - eliminar archivo de prueba
  console.log('\n6️⃣ Limpiando archivo de prueba...');
  const { error: deleteError } = await supabase.storage
    .from('chat-files')
    .remove([fileName]);
  
  if (deleteError) {
    console.warn('⚠️ No se pudo eliminar el archivo de prueba (esto es normal si no hay política DELETE)');
  } else {
    console.log('✅ Archivo de prueba eliminado');
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('✅ ¡TODO FUNCIONA CORRECTAMENTE!');
  console.log('   Puedes subir archivos en el chat sin problemas.');
  console.log('='.repeat(60));
}

// Ejecutar verificación
verificarConfiguracionStorage().catch(error => {
  console.error('💥 Error fatal:', error);
});
