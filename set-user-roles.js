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

async function setUserRoles() {
  try {
    console.log('Setting user roles...\n');
    console.log('NOTA: Los usuarios deben haberse registrado primero en la aplicación.\n');

    // Mostrar todos los usuarios existentes
    console.log('--- Checking existing profiles ---');
    const { data: allProfiles, error: listError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .order('created_at', { ascending: true });

    if (listError) {
      console.error('Error listing profiles:', listError);
      return;
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log('⚠️  No hay usuarios registrados aún.');
      console.log('\nPara configurar los roles:');
      console.log('1. Registra ambos usuarios en la aplicación (signup)');
      console.log('2. Ejecuta este script nuevamente');
      console.log('\nO ejecuta este SQL en Supabase después del registro:');
      console.log(`
UPDATE profiles SET role = 'provider' WHERE email = 'nachomolla6@gmail.com';
UPDATE profiles SET role = 'customer' WHERE email = 'ikermolla056@gmail.com';
      `);
      return;
    }

    console.log(`Found ${allProfiles.length} user(s):\n`);
    allProfiles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role || 'no role'} (${user.full_name || 'no name'})`);
    });
    console.log('');

    // Buscar y actualizar el proveedor
    const providerProfile = allProfiles.find(u => u.email === 'nachomolla6@gmail.com');
    if (providerProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', providerProfile.id);

      if (updateError) {
        console.error('❌ Error updating provider role:', updateError);
      } else {
        console.log('✅ Provider role set for: nachomolla6@gmail.com');
      }
    } else {
      console.log('⚠️  nachomolla6@gmail.com no encontrado. Debe registrarse primero.');
    }

    // Buscar y actualizar el cliente
    const customerProfile = allProfiles.find(u => u.email === 'ikermolla056@gmail.com');
    if (customerProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'customer' })
        .eq('id', customerProfile.id);

      if (updateError) {
        console.error('❌ Error updating customer role:', updateError);
      } else {
        console.log('✅ Customer role set for: ikermolla056@gmail.com');
      }
    } else {
      console.log('⚠️  ikermolla056@gmail.com no encontrado. Debe registrarse primero.');
    }

    // Mostrar resultado final
    console.log('\n--- Final Roles ---');
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('email, role, full_name')
      .order('created_at', { ascending: true });

    if (finalProfiles) {
      finalProfiles.forEach(user => {
        const roleEmoji = user.role === 'provider' ? '👨‍💼' : user.role === 'customer' ? '👤' : '❓';
        console.log(`${roleEmoji} ${user.email} - ${user.role || 'no role'}`);
      });
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

setUserRoles();
