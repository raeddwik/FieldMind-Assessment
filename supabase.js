
const SUPABASE_URL = "https://qgjdtxjsvauhtqaaebly.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "ضع_المفتاح_العام_هنا";

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
