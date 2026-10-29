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

const editableRoles = new Set(["admin", "occupational_health", "worker"]);

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
  const { data: callerRole, error: callerRoleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (callerRoleError) return jsonResponse({ error: "Unable to verify role" }, 500);
  if (callerRole?.role !== "super_admin") return jsonResponse({ error: "Forbidden" }, 403);

  let body: { action?: unknown; user_id?: unknown; role?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    body = parsed as { action?: unknown; user_id?: unknown; role?: unknown };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (body.action === "list") {
    const allUsers = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) return jsonResponse({ error: "Unable to list users" }, 500);
      allUsers.push(...data.users);
      if (data.users.length < perPage) break;
      page += 1;
      if (page > 100) break;
    }

    const { data: roleRows, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id,role");
    if (rolesError) return jsonResponse({ error: "Unable to load roles" }, 500);

    const rolesByUser = new Map<string, string[]>();
    for (const row of roleRows ?? []) {
      const current = rolesByUser.get(row.user_id) ?? [];
      current.push(row.role);
      rolesByUser.set(row.user_id, current);
    }

    return jsonResponse({
      users: allUsers.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        roles: rolesByUser.get(user.id) ?? [],
      })),
    });
  }

  if (body.action === "set_role") {
    if (typeof body.user_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.user_id)) {
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }
    if (typeof body.role !== "string" || !editableRoles.has(body.role)) {
      return jsonResponse({ error: "Invalid role" }, 400);
    }

    const { data: targetRole, error: targetRoleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (targetRoleError) return jsonResponse({ error: "Unable to verify target role" }, 500);
    if (targetRole?.role === "super_admin") {
      return jsonResponse({ error: "Super Admin accounts must be managed through a separate verified process" }, 403);
    }
    if (body.user_id === authData.user.id) {
      return jsonResponse({ error: "You cannot change your own role" }, 403);
    }

    const { error: upsertError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: body.user_id, role: body.role }, { onConflict: "user_id" });
    if (upsertError) return jsonResponse({ error: "Unable to update role" }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Unsupported action" }, 400);
});
