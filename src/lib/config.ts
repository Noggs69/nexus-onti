// Configuración del entorno
const isDevelopment = import.meta.env.DEV;

export const config = {
  // URL base de la aplicación
  appUrl: isDevelopment 
    ? 'http://localhost:5173' 
    : 'https://nexus-onti.shop',

  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Pusher
  pusher: {
    key: import.meta.env.VITE_PUSHER_KEY || '',
    cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'eu',
  },

  // URLs de API
  api: {
    pusher: isDevelopment 
      ? 'http://localhost:5000/pusher/auth'
      : 'https://api.tudominio.com/pusher/auth', // Si tienes API externa
  },
};
