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

async function checkDatabase() {
  console.log('📊 Verificando estado de la base de datos Supabase...\n');

  try {
    // Verificar perfiles
    console.log('=== PROFILES ===');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (profilesError) {
      console.error('Error:', profilesError.message);
    } else {
      console.log(`Total usuarios: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.email} - ${p.role || 'no role'} - ${p.full_name || 'sin nombre'}`);
        });
      }
    }

    // Verificar productos
    console.log('\n=== PRODUCTS ===');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, price, featured')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (productsError) {
      console.error('Error:', productsError.message);
    } else {
      console.log(`Total productos: ${products?.length || 0}`);
      if (products && products.length > 0) {
        products.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name} - €${p.price} - ${p.featured ? '⭐' : ''}`);
        });
      }
    }

    // Verificar conversaciones
    console.log('\n=== CONVERSATIONS ===');
    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (convsError) {
      console.error('Error:', convsError.message);
    } else {
      console.log(`Total conversaciones: ${conversations?.length || 0}`);
      if (conversations && conversations.length > 0) {
        conversations.forEach((c, i) => {
          console.log(`  ${i + 1}. ID: ${c.id.substring(0, 8)}... - Status: ${c.status}`);
        });
      }
    }

    // Verificar mensajes
    console.log('\n=== MESSAGES ===');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (messagesError) {
      console.error('Error:', messagesError.message);
    } else {
      console.log(`Total mensajes: ${messages?.length || 0}`);
      if (messages && messages.length > 0) {
        messages.forEach((m, i) => {
          const preview = m.content.substring(0, 50);
          console.log(`  ${i + 1}. ${preview}...`);
        });
      }
    }

    // Verificar notificaciones email
    console.log('\n=== EMAIL NOTIFICATIONS ===');
    const { data: emails, error: emailsError } = await supabase
      .from('email_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (emailsError) {
      console.error('Error:', emailsError.message);
      if (emailsError.code === '42P01') {
        console.log('⚠️  La tabla email_notifications no existe aún.');
        console.log('   Ejecuta la migración: add_user_roles_and_notifications.sql');
      }
    } else {
      console.log(`Total emails: ${emails?.length || 0}`);
      if (emails && emails.length > 0) {
        emails.forEach((e, i) => {
          console.log(`  ${i + 1}. To: ${e.to_email} - Sent: ${e.sent ? '✅' : '⏳'} - ${e.subject}`);
        });
      }
    }

    // Verificar carrito
    console.log('\n=== CART ITEMS ===');
    const { data: cart, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .limit(10);
    
    if (cartError) {
      console.error('Error:', cartError.message);
    } else {
      console.log(`Total items en carrito: ${cart?.length || 0}`);
    }

    // Verificar quotes
    console.log('\n=== QUOTES ===');
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (quotesError) {
      console.error('Error:', quotesError.message);
    } else {
      console.log(`Total quotes: ${quotes?.length || 0}`);
      if (quotes && quotes.length > 0) {
        quotes.forEach((q, i) => {
          console.log(`  ${i + 1}. Status: ${q.status} - Total: €${q.total} - ${q.customer_email}`);
        });
      }
    }

    console.log('\n✅ Verificación completada.');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkDatabase();
