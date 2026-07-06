import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    // Apagar el autorefresh asíncrono para eliminar por completo los cuellos de botella 
    // de _onVisibilityChanged que congelaban la UI. Axios ya maneja el logout al dar 401.
    autoRefreshToken: false,
  }
});
