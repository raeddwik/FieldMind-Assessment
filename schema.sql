-- FieldMind initial schema for Supabase
-- Run this in Supabase SQL Editor after creating a new project.
-- IMPORTANT: test with non-sensitive demo data before any real deployment.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'occupational_health', 'worker')),
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scale_version text not null,
  answers jsonb not null,
  result jsonb not null default '{}'::jsonb,
  consent_given boolean not null default false check (consent_given = true),
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);
create index if not exists assessments_created_idx
  on public.assessments (created_at desc);

alter table public.user_roles enable row level security;
alter table public.assessments enable row level security;

-- A user can see their own role row; no client-side role assignment policy is created.
drop policy if exists "users can read own role" on public.user_roles;
create policy "users can read own role"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

-- Admin role lookup is protected by RLS. This function checks role membership
-- without exposing other users' role rows to the caller.
create or replace function public.is_fieldmind_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = 'admin'
  );
$$;

revoke all on function public.is_fieldmind_admin() from public;
grant execute on function public.is_fieldmind_admin() to authenticated;

drop policy if exists "workers insert own assessments" on public.assessments;
create policy "workers insert own assessments"
  on public.assessments for insert
  to authenticated
  with check (user_id = (select auth.uid()) and consent_given = true);

drop policy if exists "workers read own assessments" on public.assessments;
create policy "workers read own assessments"
  on public.assessments for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "admins read assessments" on public.assessments;
create policy "admins read assessments"
  on public.assessments for select
  to authenticated
  using (public.is_fieldmind_admin());

-- No client policies allow users to update or delete submitted assessments.
-- Do not expose service_role keys in the browser.
