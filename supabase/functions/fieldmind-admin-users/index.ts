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

const editableRoles = new Set(["admin", "occupational_health", "worker"]);

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
  const { data: callerRole, error: callerRoleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (callerRoleError) return jsonResponse({ error: "Unable to verify role" }, 500, req);
  if (callerRole?.role !== "super_admin") return jsonResponse({ error: "Forbidden" }, 403, req);

  let body: { action?: unknown; user_id?: unknown; role?: unknown; email?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Invalid JSON body" }, 400, req);
    }
    body = parsed as { action?: unknown; user_id?: unknown; role?: unknown };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, req);
  }

  if (body.action === "list") {
    const allUsers = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) return jsonResponse({ error: "Unable to list users" }, 500, req);
      allUsers.push(...data.users);
      if (data.users.length < perPage) break;
      page += 1;
      if (page > 100) break;
    }

    const { data: roleRows, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id,role");
    if (rolesError) return jsonResponse({ error: "Unable to load roles" }, 500, req);

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
    }, 200, req);
  }

  if (body.action === "invite_worker") {
    if (typeof body.email !== "string") {
      return jsonResponse({ error: "Invalid email address" }, 400, req);
    }

    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Invalid email address" }, 400, req);
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: "https://raeddwik.github.io/FieldMind-Assessment/" }
    );

    if (inviteError || !inviteData.user) {
      return jsonResponse({
        error: "Unable to send invitation. The email may already be registered or email delivery may be unavailable.",
      }, 400, req);
    }

    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: inviteData.user.id, role: "worker" });

    if (roleInsertError) {
      await adminClient.auth.admin.deleteUser(inviteData.user.id);
      return jsonResponse({ error: "Unable to assign the default user role; the pending account was rolled back." }, 500, req);
    }

    return jsonResponse({
      ok: true,
      user: { id: inviteData.user.id, email: inviteData.user.email ?? email, role: "worker" },
    }, 200, req);
  }

  if (body.action === "set_role") {
    if (typeof body.user_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.user_id)) {
      return jsonResponse({ error: "Invalid user ID" }, 400, req);
    }
    if (typeof body.role !== "string" || !editableRoles.has(body.role)) {
      return jsonResponse({ error: "Invalid role" }, 400, req);
    }

    const { data: targetRole, error: targetRoleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (targetRoleError) return jsonResponse({ error: "Unable to verify target role" }, 500, req);
    if (targetRole?.role === "super_admin") {
      return jsonResponse({ error: "Super Admin accounts must be managed through a separate verified process" }, 403, req);
    }
    if (body.user_id === authData.user.id) {
      return jsonResponse({ error: "You cannot change your own role" }, 403, req);
    }

    const { error: upsertError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: body.user_id, role: body.role }, { onConflict: "user_id" });
    if (upsertError) return jsonResponse({ error: "Unable to update role" }, 500, req);
    return jsonResponse({ ok: true }, 200, req);
  }

  return jsonResponse({ error: "Unsupported action" }, 400, req);
});
