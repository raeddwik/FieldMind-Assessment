-- Keep the admin SECURITY DEFINER helper outside exposed API schemas.
-- Authenticated users may invoke it only through the RLS policy; the private
-- schema is not part of the PostgREST exposed schema list.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_fieldmind_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = (select auth.uid())
      and r.role in ('admin', 'super_admin')
  );
$function$;

revoke all on function private.is_fieldmind_admin() from public, anon;
grant execute on function private.is_fieldmind_admin() to authenticated;

drop policy if exists "admins read assessments" on public.assessments;
create policy "admins read assessments"
on public.assessments
for select
to authenticated
using (private.is_fieldmind_admin());

drop function if exists public.is_fieldmind_admin();
