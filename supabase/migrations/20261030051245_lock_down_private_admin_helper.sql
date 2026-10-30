-- Keep the private admin helper inaccessible through the Data API.
-- The current Staging RLS policies and Edge Functions perform their own
-- authorization checks and do not call this helper from client sessions.
revoke usage on schema private from public, anon, authenticated;
revoke all on function private.is_fieldmind_admin() from public, anon, authenticated;
grant usage on schema private to postgres;
grant execute on function private.is_fieldmind_admin() to postgres;
