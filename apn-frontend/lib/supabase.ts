import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// Idan yana gudanarwa a Server-Side (API Routes), yi amfani da Service Role Key don tsallake tsangwamar RLS.
// Idan babu shi ko kuma yana Browser-Side, yi amfani da Anon Key.
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("Supabase URL missing during build, using placeholder client.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: typeof window !== 'undefined', // Yana adana session kawai idan a browser yake
    autoRefreshToken: typeof window !== 'undefined',
  },
});