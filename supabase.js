
/*
  FieldMind Supabase configuration.
  Use only the public Publishable/anon key.
  Never put a service_role or secret key here.
*/

const SUPABASE_URL = 'https://bxhzzikfafazovzoyasy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1F9Mh8BpA4HiKOayK6kYfQ_9bsrWW1m';

window.fieldMindSupabase = null;

if (
  window.supabase &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE')
) {
  window.fieldMindSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
}
