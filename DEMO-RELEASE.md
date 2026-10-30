# FieldMind — Demo Release Status

**Release:** Private-account management demonstration  
**Date:** 30 October 2026  
**Published URL:** https://raeddwik.github.io/FieldMind-Assessment/  
**Application backend:** Supabase Staging only (`qjmolklafyqwsvaasyhd`)  
**Status:** Published successfully; synthetic data only.

## What is live

- Arabic right-to-left 42-item questionnaire.
- Email magic-link login for pre-provisioned accounts only; automatic account creation is disabled.
- User, admin, and super-admin application paths.
- Server-side answer validation and result generation.
- Descriptive domain summaries and follow-up suggestions.
- Protected super-admin results and user-management functions.
- Explicit on-page notice that this is a demo and only synthetic answers should be entered.

## Staging account roles

The two existing personal test accounts have been assigned:
- Primary account: `super_admin`
- Secondary account: `admin`

No public self-registration is enabled. Do not share passwords or login links.

## Verification

- GitHub Actions validation run `41007534008`: passed (JavaScript syntax, assessment-engine tests, 42-item consistency, and Deno type checks for the three Edge Functions).
- GitHub Pages deployment run `41008471687`: succeeded.
- Staging currently contains 3 test assessment records.
- Staging RLS policies limit assessment reads to the record owner. Direct client INSERT into `assessments` is not granted; the authenticated submission Edge Function performs the validated insert.
- The `user_roles` table exposes only the caller's own role to authenticated users; direct client INSERT/UPDATE of roles is not granted.
- The browser uses a Supabase publishable key only. Service-role credentials remain server-side.

## Password and plan limitation

The project owner reports configuring a minimum password length of 12 characters with mixed character requirements. Leaked Password Protection (HaveIBeenPwned checking) is unavailable on the current Supabase plan and remains a known limitation. This is recorded transparently and is not being treated as a blocker for this restricted demonstration. It must be reconsidered before any institutional deployment.

## Important boundaries

- The GitHub repository and static Pages site are public-facing; the application requires a pre-provisioned account to use it, but this is not equivalent to private hosting.
- Use synthetic answers only. Do not enter identifiable employee details or real psychological responses.
- The questionnaire is an owner-designed draft, not a validated or licensed clinical instrument.
- Results are descriptive only. They are not diagnosis, clinical severity, or fitness-for-work determinations.
- Do not use results for hiring, promotion, discipline, assignment, medical clearance, or any other employment decision.
- Do not run a real-worker pilot until the organization approves the privacy notice, purpose/legal basis, roles, retention/deletion, professional review, and a staffed human safety-response process.
- Production Supabase is not connected to this demo. No Production Edge Functions were deployed as part of this release.

## Next step after management review

If management approves the concept, create a separately governed institutional deployment plan: dedicated company-controlled hosting and Supabase environment, approved identity lifecycle, data-protection controls, audit/retention, clinical and occupational-health review, and a tested human safety-response pathway.
