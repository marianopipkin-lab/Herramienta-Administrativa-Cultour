import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with fallback
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const rawSupabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Clean values and check configuration
const supabaseUrl = rawSupabaseUrl.trim();
const supabaseAnonKey = rawSupabaseAnonKey.trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

// Create the Supabase client (or safe mock fallback to prevent runtime crash if keys are unset)
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured() ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
