import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://raeddwik.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration incomplete" }, 500);
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "Invalid session" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (roleError) return jsonResponse({ error: "Unable to verify role" }, 500);
  if (roleRow?.role !== "super_admin") return jsonResponse({ error: "Forbidden" }, 403);

  let body: { offset?: unknown; limit?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    body = parsed as { offset?: unknown; limit?: unknown };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const offset = Number.isInteger(body.offset) && Number(body.offset) >= 0
    ? Number(body.offset)
    : 0;
  const limit = Number.isInteger(body.limit)
    ? Math.min(Math.max(Number(body.limit), 1), 100)
    : 100;

  const { data, error, count } = await adminClient
    .from("assessments")
    .select("id,user_id,created_at,scale_version,result", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return jsonResponse({ error: "Unable to load assessment results" }, 500);
  return jsonResponse({ rows: data ?? [], total: count ?? 0, offset, limit }, 200, req);
});
