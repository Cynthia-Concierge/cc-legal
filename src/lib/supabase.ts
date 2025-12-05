import { createClient, SupabaseClient } from '@supabase/supabase-js';

// In Vite, only variables prefixed with VITE_ are exposed to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug: Log what we're getting (only in dev mode)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
    // Don't log the full key for security
    allEnvVars: Object.keys(import.meta.env).filter(k => k.includes('SUPABASE'))
  });
}

// Only create client if we have the required variables
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (import.meta.env.DEV) {
      console.log('✅ Supabase client created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
  }
} else {
  console.warn(
    '⚠️ Supabase environment variables not set for frontend.\n' +
    'Add these to your .env file:\n' +
    '  VITE_SUPABASE_URL=your-supabase-url\n' +
    '  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key\n' +
    '\n' +
    'Note: Frontend requires VITE_ prefix (different from backend SUPABASE_URL/SUPABASE_ANON_KEY)\n' +
    '⚠️ IMPORTANT: After adding variables, RESTART your dev server (npm run dev)\n' +
    'Password functionality will work with localStorage only until these are set.'
  );
}

export { supabase };
