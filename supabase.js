/*
  FieldMind configuration
  1) Create a Supabase project.
  2) Replace both placeholders below with the Project URL and Publishable/anon key.
  3) Never put a service_role/secret key in this public file.
*/

const SUPABASE_URL = 'bxhzzikfafazovzoyasy';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1F9Mh8BpA4HiKOayK6kYfQ_9bsrWW1m';

window.fieldMindSupabase = null;
if (window.supabase && SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
  window.fieldMindSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}
