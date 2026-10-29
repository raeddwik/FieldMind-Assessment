# FieldMind Edge Functions — deployment and verification

**Do not use real worker data until this checklist is complete.** Adding these files to GitHub does not deploy them to Supabase. The live functions, database policies, and app must be tested together in a staging environment first.

## Functions required by the frontend

- `fieldmind-superadmin-results`: returns paginated assessment metadata/results to an authenticated `super_admin`. It intentionally does not return the raw `answers` JSON.
- `fieldmind-admin-users`: lists user accounts and lets a `super_admin` assign only `admin`, `occupational_health`, or `worker` to another account. It refuses self-role changes and refuses changes to `super_admin` accounts.
- `fieldmind-submit-assessment`: validates the exact questionnaire version, all 42 expected answer IDs, and each answer's allowed numeric range; computes the draft follow-up summary on the server; and inserts the record using the authenticated user's JWT so database RLS still applies.

All three functions require an authenticated bearer token and validate it with Supabase Auth, use the service-role key only in the server runtime where needed, return generic errors rather than database details, and allow browser CORS only from `https://raeddwik.github.io`.

Authorization differs by function:
- `fieldmind-admin-users` and `fieldmind-superadmin-results` independently verify that the authenticated caller has the `super_admin` role.
- `fieldmind-submit-assessment` accepts an authenticated user of any role, because a worker must be able to submit their own assessment. It derives `user_id` from the validated JWT and ignores any client-supplied user ID or result.
- The submission function uses a service-role database client for the insert. That client bypasses RLS, so its identity check and server-side validation are critical controls; do not describe that insert as RLS-enforced.

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
   supabase functions deploy fieldmind-submit-assessment
   ```

4. Review and apply the migration in `supabase/migrations/202610290001_require_server_assessment_submission.sql` to the staging database before testing. Do not run it against production without a reviewed change window and rollback plan.
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
- The submission function rejects missing/extra answer IDs, invalid answer values, unsupported questionnaire versions, and unauthenticated requests.
- A worker submission is saved with the authenticated user's ID; the client cannot choose another user's ID or submit a precomputed result.
- The CORS preflight succeeds from the published GitHub Pages origin.
- Check Supabase logs for errors, without copying sensitive response bodies into tickets or chat.

## Important remaining security and safety limitations

- Historical rows may contain client-supplied `result` JSON and must be treated as **untrusted historical data**. Do not treat their result summaries as server-validated.
- The submission function's service-role client bypasses RLS. It must validate the JWT, exact answer set, value ranges, version, and consent before inserting, and it must always derive `user_id` from the authenticated user.
- The current questionnaire can display safety-related guidance to the respondent, but the application does **not** by itself guarantee that a qualified person is alerted or available to respond. Before any real-worker use, establish, staff, and test a documented human response pathway for safety-related answers, including ownership, response times, confidentiality, escalation, and emergency procedures.
- Consent must be informed and voluntary. Ensure the privacy notice, access roles, purpose, retention period, and support pathway are actually approved and available before inviting workers to submit sensitive data.
- Do not use this draft to make clinical diagnoses, employment decisions, or fitness-for-work decisions.

## Database schema note

`schema.sql` is a fresh-install template, not a migration to run blindly against the live project. The live database must be inspected and any changes applied as a reviewed migration after backup and staging validation.
