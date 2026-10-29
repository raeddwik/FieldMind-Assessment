# FieldMind Edge Functions — deployment and verification

**Do not use real worker data until this checklist is complete.** Adding these files to GitHub does not deploy them to Supabase. The live functions, database policies, and app must be tested together in a staging environment first.

## Functions required by the frontend

- `fieldmind-superadmin-results`: returns paginated assessment metadata/results to an authenticated `super_admin`. It intentionally does not return the raw `answers` JSON.
- `fieldmind-admin-users`: lists user accounts and lets a `super_admin` assign only `admin`, `occupational_health`, or `worker` to another account. It refuses self-role changes and refuses changes to `super_admin` accounts.

Both functions:
- require an authenticated bearer token and validate it with Supabase Auth;
- check the caller's role on the server, not just in the browser UI;
- use the service-role key only in the server runtime;
- return generic errors rather than database details;
- allow browser CORS only from `https://raeddwik.github.io`.

## Deploy from a trusted computer

1. Install and authenticate the Supabase CLI using the official Supabase instructions.
2. In a terminal, from the repository root, link the correct Supabase project. Confirm the project reference before proceeding:
   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
3. Deploy the functions:
   ```sh
   supabase functions deploy fieldmind-superadmin-results
   supabase functions deploy fieldmind-admin-users
   ```
4. Confirm the project has the expected server-side environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Supabase normally provides these in the Edge Function environment. Never put the service-role key in GitHub, `supabase.js`, HTML, or browser code.
5. Keep the GitHub Pages app on its current production version until staging checks pass. A push to the `main` branch triggers GitHub Pages deployment; this development branch does not deploy through the repository's current workflow.

## Required staging tests

- A signed-out request to either function is rejected.
- A signed-in `worker` request is rejected with 403.
- A signed-in `admin` request is rejected with 403.
- A signed-in `super_admin` can list user accounts and page through assessment metadata.
- A `super_admin` cannot demote themselves or modify another `super_admin` using the user-management function.
- A `super_admin` can assign only the three permitted non-super-admin roles.
- A normal user still cannot read other users' assessment rows through the browser client.
- The CORS preflight succeeds from the published GitHub Pages origin.
- Check Supabase logs for errors, without copying sensitive response bodies into tickets or chat.

## Important remaining security limitation

The current browser calculates the draft follow-up result and submits the `result` JSON with the answers. RLS verifies ownership and consent but does not validate that the submitted result was calculated honestly. Therefore stored result JSON must be treated as **untrusted client-supplied data**, not as an authoritative assessment. Before any operational use, move calculation/validation to a server-side submission function or independently recompute and validate the result server-side. Do not use this draft to make clinical, employment, or fitness-for-work decisions.

## Database schema note

`schema.sql` is a fresh-install template, not a migration to run blindly against the live project. The live database must be inspected and any changes applied as a reviewed migration after backup and staging validation.
