import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvclaylphpigdidtqbed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Y2xheWxwaHBpZ2RpZHRxYmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NDgzNDAsImV4cCI6MjA1MjEyNDM0MH0.9Qc7VJuZ7w02LZrxN_7vGY-FkWDlH_L_Xjn4qxBt3LY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarSQL() {
  const sql = `
-- Eliminar todos los triggers relacionados con auto-asignación de proveedores
DROP TRIGGER IF EXISTS assign_provider_to_conversation ON conversations;
DROP TRIGGER IF EXISTS auto_assign_provider_trigger ON conversations;
DROP TRIGGER IF EXISTS set_provider_trigger ON conversations;

-- Eliminar funciones relacionadas
DROP FUNCTION IF EXISTS auto_assign_provider();
DROP FUNCTION IF EXISTS assign_provider_to_new_conversation();

-- Verificar que se eliminaron
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'conversations';
  `;

  console.log('📝 Ejecutando SQL para desactivar triggers...\n');

  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: sql 
  });

  if (error) {
    console.error('❌ Error al ejecutar SQL:', error);
    return;
  }

  console.log('✅ SQL ejecutado correctamente');
  console.log('📋 Resultado:', data);
  
  // Verificar conversaciones existentes
  console.log('\n🔍 Verificando conversaciones...');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, customer_id, provider_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (convError) {
    console.error('Error al verificar conversaciones:', convError);
  } else {
    console.log('\n📊 Últimas 5 conversaciones:');
    conversations.forEach(conv => {
      console.log(`  - ID: ${conv.id.substring(0, 8)}... | Provider: ${conv.provider_id ? conv.provider_id.substring(0, 8) + '...' : 'NULL (sin asignar)'}`);
    });
  }
}

ejecutarSQL().catch(console.error);
