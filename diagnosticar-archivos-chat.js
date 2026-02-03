/**
 * Script para diagnosticar por qué los archivos no aparecen en el chat
 * Ejecuta esto en la consola del navegador (F12)
 */

async function diagnosticarArchivosEnChat() {
  console.log('🔍 Diagnosticando archivos en el chat...\n');

  // 1. Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No estás autenticado');
    return;
  }
  console.log('✅ Usuario:', user.email);
  console.log('   User ID:', user.id, '\n');

  // 2. Obtener la conversación actual (ajusta el conversationId si es necesario)
  const conversationId = window.location.search.match(/conversation=([^&]+)/)?.[1];
  if (!conversationId) {
    console.error('❌ No hay conversación activa en la URL');
    console.log('   Abre una conversación primero');
    return;
  }
  console.log('✅ Conversación ID:', conversationId, '\n');

  // 3. Buscar mensajes con archivos adjuntos
  console.log('📨 Buscando mensajes con archivos adjuntos...');
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error al obtener mensajes:', error);
    return;
  }

  console.log(`   Encontrados ${messages.length} mensajes recientes\n`);

  // 4. Filtrar mensajes con attachments
  const messagesWithAttachments = messages.filter(m => m.attachment_url);
  
  if (messagesWithAttachments.length === 0) {
    console.warn('⚠️ NO hay mensajes con archivos adjuntos en esta conversación');
    console.log('\n📋 PROBLEMA IDENTIFICADO:');
    console.log('   El archivo se subió a Storage pero NO se guardó en la base de datos');
    console.log('\n🔧 POSIBLES CAUSAS:');
    console.log('   1. Error al guardar el mensaje después de subir el archivo');
    console.log('   2. El campo attachment_url no se está guardando');
    console.log('   3. Hay un error en la función sendMessage()');
    console.log('\n💡 SOLUCIÓN:');
    console.log('   Revisa la consola del navegador por errores cuando envías un archivo');
    return;
  }

  console.log(`✅ Encontrados ${messagesWithAttachments.length} mensajes con archivos\n`);

  // 5. Mostrar detalles de cada archivo
  console.log('📎 DETALLES DE ARCHIVOS ADJUNTOS:\n');
  messagesWithAttachments.forEach((msg, index) => {
    console.log(`${index + 1}. Mensaje ID: ${msg.id}`);
    console.log(`   Contenido: ${msg.content || '(sin texto)'}`);
    console.log(`   URL: ${msg.attachment_url}`);
    console.log(`   Tipo: ${msg.attachment_type || '❌ NO ESPECIFICADO'}`);
    console.log(`   Nombre: ${msg.attachment_name || '❌ NO ESPECIFICADO'}`);
    console.log(`   Tamaño: ${msg.attachment_size ? (msg.attachment_size / 1024).toFixed(2) + ' KB' : '❌ NO ESPECIFICADO'}`);
    console.log(`   Fecha: ${new Date(msg.created_at).toLocaleString()}`);
    
    // Verificar si el tipo está correctamente configurado
    if (!msg.attachment_type) {
      console.warn('   ⚠️ PROBLEMA: attachment_type es NULL');
      console.log('   → El archivo NO se renderizará correctamente en el chat');
    } else if (msg.attachment_type === 'video') {
      console.log('   ✅ Tipo correcto para video');
    }
    console.log('');
  });

  // 6. Verificar si los archivos existen en Storage
  console.log('🗄️ Verificando archivos en Storage...\n');
  
  for (const msg of messagesWithAttachments) {
    if (!msg.attachment_url) continue;
    
    // Extraer el path del archivo de la URL
    const urlParts = msg.attachment_url.split('/chat-files/');
    if (urlParts.length < 2) {
      console.warn(`⚠️ URL mal formada: ${msg.attachment_url}`);
      continue;
    }
    
    const filePath = urlParts[1];
    console.log(`Verificando: ${filePath}`);
    
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('chat-files')
        .download(filePath);
      
      if (downloadError) {
        console.error(`   ❌ ERROR: ${downloadError.message}`);
      } else {
        console.log(`   ✅ Archivo existe (${(data.size / 1024).toFixed(2)} KB)`);
      }
    } catch (err) {
      console.error(`   ❌ Error al verificar: ${err.message}`);
    }
  }

  // 7. Resumen y recomendaciones
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('='.repeat(60));
  
  const videoMessages = messagesWithAttachments.filter(m => m.attachment_type === 'video');
  const messagesWithoutType = messagesWithAttachments.filter(m => !m.attachment_type);
  
  console.log(`\n✅ Total de archivos: ${messagesWithAttachments.length}`);
  console.log(`📹 Videos: ${videoMessages.length}`);
  console.log(`⚠️ Sin tipo especificado: ${messagesWithoutType.length}`);
  
  if (messagesWithoutType.length > 0) {
    console.log('\n❌ PROBLEMA ENCONTRADO:');
    console.log('   Hay archivos sin tipo (attachment_type = NULL)');
    console.log('\n🔧 SOLUCIÓN:');
    console.log('   Ejecuta este SQL en Supabase SQL Editor:');
    console.log('\n   UPDATE messages');
    console.log('   SET attachment_type = CASE');
    console.log("     WHEN attachment_url LIKE '%.mp4%' OR attachment_url LIKE '%.mov%' THEN 'video'");
    console.log("     WHEN attachment_url LIKE '%.jpg%' OR attachment_url LIKE '%.png%' THEN 'image'");
    console.log("     ELSE 'document'");
    console.log('   END');
    console.log('   WHERE attachment_url IS NOT NULL AND attachment_type IS NULL;');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Ejecutar diagnóstico
diagnosticarArchivosEnChat();
