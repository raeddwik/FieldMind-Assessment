# FieldMind staging verification checklist

This is a **staging-only** checklist. Do not run write tests against production or use real worker mental-health data. The SQL below is read-only; it does not apply migrations, create records, or deploy functions.

## 1. Confirm the target first

- Use a separate Supabase staging project, not the production project.
- Confirm the project reference in the Supabase dashboard before running any command.
- Back up staging if it contains data you need.
- Deploy the three Edge Functions to staging and configure their server-side environment.
- Review and apply `supabase/migrations/202610290001_require_server_assessment_submission.sql` to staging only.

## 2. Read-only privilege checks

Run this query in the staging SQL Editor after the migration. Expected: `anon_can_insert=false`, `authenticated_can_insert=false`, and `service_role_can_insert=true`.

```sql
select
  has_table_privilege('anon', 'public.assessments', 'INSERT') as anon_can_insert,
  has_table_privilege('authenticated', 'public.assessments', 'INSERT') as authenticated_can_insert,
  has_table_privilege('service_role', 'public.assessments', 'INSERT') as service_role_can_insert;
```

Check the table still has row-level security enabled:

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'assessments';
```

Expected: one row, `rls_enabled=true`. The service-role client used by the submission function bypasses RLS, so these read-only checks do not replace function authorization tests.

## 3. Verify the application path

Use dedicated test accounts and synthetic answers only:

1. Sign out and invoke each function. Expect an authentication failure.
2. Sign in as a worker and submit one complete synthetic questionnaire with consent. Expect success.
3. Confirm the saved record's `user_id` equals the authenticated worker's user ID and the returned result has `previewOnly=true`, `classification=null`, and no clinical score.
4. Try the submission with consent false, an unsupported scale version, one missing answer, one unexpected answer ID, and an out-of-range value. Each should be rejected without a new row.
5. While signed in as the worker, try a direct browser-client INSERT into `assessments`. Expect a permission error. Do not insert a valid test row through this path.
6. Sign in as a second worker and confirm neither worker can read the other's assessment rows.
7. Test the super-admin functions as worker, admin, and super_admin accounts. Only super_admin should be able to use privileged operations.
8. Test the safety response workflow with synthetic data and the designated trained responder. Confirm alert ownership, response-time expectations, escalation, and documentation.

## 4. Evidence to record

Record the staging project reference (not secrets), migration version, deployed function versions, test timestamp, pass/fail for each step, and non-sensitive error codes. Do not copy access tokens, service-role keys, raw answers, or personally identifying worker information into GitHub issues or chat.

## 5. Stop conditions

Do not merge or deploy to production if any privilege check differs from the expected result, if direct INSERT succeeds, if the function accepts malformed payloads, if records can be read across users, or if the human safety response pathway is not staffed and tested.