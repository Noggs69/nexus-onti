import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkQuoteData() {
  try {
    console.log('🔍 Revisando datos de cotizaciones...\n');

    // Obtener última cotización
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error al obtener cotizaciones:', error);
      return;
    }

    if (!quotes || quotes.length === 0) {
      console.log('⚠️  No hay cotizaciones en la base de datos');
      return;
    }

    const quote = quotes[0];
    console.log('📋 Última cotización:');
    console.log('ID:', quote.id);
    console.log('Cliente:', quote.customer_name || '(vacío)');
    console.log('Email:', quote.customer_email || '(vacío)');
    console.log('Dirección:', quote.shipping_address || '(vacío)');
    console.log('Ciudad:', quote.shipping_city || '(vacío)');
    console.log('Código Postal:', quote.shipping_postal_code || '(vacío)');
    console.log('País:', quote.shipping_country || '(vacío)');
    console.log('Subtotal:', quote.subtotal);
    console.log('Envío:', quote.shipping_cost);
    console.log('Total:', quote.total);
    console.log('\n');

    // Obtener items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*, products(*)')
      .eq('quote_id', quote.id);

    if (itemsError) {
      console.error('❌ Error al obtener items:', itemsError);
      return;
    }

    console.log('📦 Items de la cotización:');
    items.forEach((item, i) => {
      console.log(`\nItem ${i + 1}:`);
      console.log('  Producto:', item.products?.name || '(sin nombre)');
      console.log('  Cantidad:', item.quantity);
      console.log('  Precio unitario:', item.unit_price);
      console.log('  Total:', item.total_price);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkQuoteData();
