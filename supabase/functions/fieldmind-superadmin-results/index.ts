import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://raeddwik.github.io", "http://localhost:8001", "http://localhost:8010", "http://127.0.0.1:8010"]);
function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? corsHeadersFor(req) : {}), "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, req);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required" }, 401, req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration incomplete" }, 500, req);
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return jsonResponse({ error: "Invalid session" }, 401, req);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (roleError) return jsonResponse({ error: "Unable to verify role" }, 500, req);
  if (roleRow?.role !== "super_admin") return jsonResponse({ error: "Forbidden" }, 403, req);

  let body: { offset?: unknown; limit?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Invalid JSON body" }, 400, req);
    }
    body = parsed as { offset?: unknown; limit?: unknown };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, req);
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

  if (error) return jsonResponse({ error: "Unable to load assessment results" }, 500, req);
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
  const emailEntries = await Promise.all(userIds.map(async (userId) => {
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError) {
      console.error("Unable to resolve assessment owner email", userId, userError.message);
      return [userId, null] as const;
    }
    return [userId, userData.user?.email ?? null] as const;
  }));
  const emailByUserId = new Map(emailEntries);
  const rowsWithEmail = rows.map((row: any) => ({ ...row, user_email: emailByUserId.get(row.user_id) ?? null }));
  return jsonResponse({ rows: rowsWithEmail, total: count ?? 0, offset, limit }, 200, req);
});
