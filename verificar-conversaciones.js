import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvclaylphpigdidtqbed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Y2xheWxwaHBpZ2RpZHRxYmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NDgzNDAsImV4cCI6MjA1MjEyNDM0MH0.9Qc7VJuZ7w02LZrxN_7vGY-FkWDlH_L_Xjn4qxBt3LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarConversaciones() {
  console.log('🔍 Verificando conversaciones recientes...\n');
  
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, customer_id, provider_id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Últimas 10 conversaciones:\n');
  conversations.forEach((conv, index) => {
    const providerId = conv.provider_id ? `${conv.provider_id.substring(0, 8)}...` : '❌ NULL (sin asignar)';
    const customerId = conv.customer_id.substring(0, 8);
    const fecha = new Date(conv.created_at).toLocaleString('es-ES');
    
    console.log(`${index + 1}. Conversación ${conv.id.substring(0, 8)}...`);
    console.log(`   Cliente: ${customerId}...`);
    console.log(`   Proveedor: ${providerId}`);
    console.log(`   Fecha: ${fecha}`);
    console.log(`   Estado: ${conv.status}\n`);
  });

  // Contar conversaciones sin asignar
  const sinAsignar = conversations.filter(c => !c.provider_id).length;
  const asignadas = conversations.filter(c => c.provider_id).length;
  
  console.log(`\n📈 Resumen:`);
  console.log(`   ✅ Sin asignar (disponibles): ${sinAsignar}`);
  console.log(`   👤 Asignadas a proveedor: ${asignadas}`);
  
  if (asignadas > 0) {
    console.log(`\n⚠️  PROBLEMA: Hay conversaciones asignadas automáticamente`);
    console.log(`   Esto indica que el trigger sigue activo en la base de datos`);
    console.log(`\n📝 SOLUCIÓN: Ejecuta este SQL en Supabase Dashboard > SQL Editor:`);
    console.log(`\n   DROP TRIGGER IF EXISTS assign_provider_to_conversation ON conversations;`);
    console.log(`   DROP TRIGGER IF EXISTS auto_assign_provider_trigger ON conversations;`);
    console.log(`   DROP FUNCTION IF EXISTS auto_assign_provider();`);
  } else {
    console.log(`\n✅ Perfecto! Todas las conversaciones están sin asignar`);
  }
}

verificarConversaciones().catch(console.error);
