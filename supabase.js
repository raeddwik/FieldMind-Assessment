
/*
  FieldMind Supabase configuration.
  Use only the public Publishable/anon key.
  Never put a service_role or secret key here.
*/

const SUPABASE_URL = 'https://qgjdtxjsvauhtqaaebly.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_UQXQgvPHUu158Fdb3PLPwA_owTViu06';

window.fieldMindSupabase = null;

if (
  window.supabase &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('PUT_YOUR_NEW')
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
