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

async function checkStructure() {
  console.log('Checking profiles table structure...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profiles:', JSON.stringify(profiles, null, 2));
  }
  
  // Check conversations
  console.log('\nChecking conversations...');
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .limit(3);
  
  console.log('Conversations:', JSON.stringify(conversations, null, 2));
}

checkStructure();
