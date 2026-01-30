import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAllUsers() {
  try {
    console.log('🗑️  Borrando usuarios del proyecto...\n');

    // Primero mostrar usuarios existentes
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No hay usuarios para borrar.');
      return;
    }

    console.log(`Encontrados ${profiles.length} usuario(s):\n`);
    profiles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} (${user.full_name || 'sin nombre'})`);
    });
    console.log('\n---\n');

    // Borrar perfiles (esto también debería eliminar registros relacionados si hay CASCADE configurado)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (usando condición que siempre es verdadera)

    if (deleteError) {
      console.error('❌ Error al borrar perfiles:', deleteError);
      console.log('\nNOTA: Es posible que necesites borrar manualmente desde el Dashboard de Supabase.');
      console.log('Ve a: Authentication > Users y borra cada usuario');
      return;
    }

    console.log('✅ Perfiles borrados correctamente.\n');
    
    console.log('NOTA IMPORTANTE:');
    console.log('Los perfiles se han borrado de la tabla profiles, pero los usuarios de Auth');
    console.log('todavía pueden existir. Para borrarlos completamente:');
    console.log('\n1. Ve al Dashboard de Supabase');
    console.log('2. Authentication > Users');
    console.log('3. Borra cada usuario manualmente');
    console.log('\nO ejecuta este SQL en Supabase (como admin):');
    console.log(`
-- Borrar conversaciones y mensajes
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM email_notifications;
DELETE FROM cart_items;
DELETE FROM profiles;

-- Nota: Para borrar usuarios de auth.users necesitas hacerlo desde el dashboard
-- o usar la API de administración con la service key
    `);

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

deleteAllUsers();
