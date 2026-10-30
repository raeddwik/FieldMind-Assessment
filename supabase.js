const SUPABASE_URL = "https://qjmolklafyqwsvaasyhd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_K16GJJCaVpGNS3mdAwDfAg_8cE8BxuR";
window.fieldMindSupabase = null;

if (window.supabase) {
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
