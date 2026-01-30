import { createClient } from '@supabase/supabase-js';

// Leer las variables de entorno del archivo .env manualmente
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

async function updateAirPodsImage() {
  try {
    // Buscar el producto AirPods Pro 2 por nombre
    const { data: products, error: searchError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', '%airpod%pro%2%');

    if (searchError) {
      console.error('Error searching for product:', searchError);
      return;
    }

    console.log('Found products:', products);

    if (products && products.length > 0) {
      const product = products[0];
      console.log(`Updating product: ${product.name} (ID: ${product.id})`);

      // Actualizar la imagen
      const { data, error } = await supabase
        .from('products')
        .update({ 
          image_url: 'https://kfdigital.co/wp-content/uploads/2023/07/WhatsApp-Image-2023-07-19-at-6.28.58-PM.jpeg'
        })
        .eq('id', product.id)
        .select();

      if (error) {
        console.error('Error updating product:', error);
      } else {
        console.log('Product updated successfully:', data);
      }
    } else {
      console.log('No AirPods Pro 2 product found. Listing all products:');
      
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, name, slug');
      
      console.log(allProducts);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateAirPodsImage();
