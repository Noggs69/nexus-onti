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

async function runMigration() {
  console.log('Running migration to add user roles and email notifications...\n');

  try {
    // Read the SQL file
    const sql = readFileSync('./supabase/migrations/add_user_roles_and_notifications.sql', 'utf-8');
    
    console.log('Migration SQL:');
    console.log(sql);
    console.log('\n---\n');
    console.log('NOTA: Necesitas ejecutar este SQL manualmente en el SQL Editor de Supabase.');
    console.log('1. Ve a tu dashboard de Supabase');
    console.log('2. Abre el SQL Editor');
    console.log('3. Copia y pega el contenido del archivo: supabase/migrations/add_user_roles_and_notifications.sql');
    console.log('4. Ejecuta el SQL');
    console.log('\nO usa el Supabase CLI si lo tienes configurado:');
    console.log('supabase db push');
    
  } catch (err) {
    console.error('Error reading migration file:', err);
  }
}

runMigration();
