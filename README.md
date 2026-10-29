# FieldMind — Occupational Mental Health Assessment

FieldMind is an Arabic, right-to-left web app for an **internal, preliminary occupational mental-health and wellbeing questionnaire**. The current working branch is `fieldmind-internal-screening-v1`; its assessment is a custom 42-item draft.

## Status and limits

- The questionnaire and follow-up rules are internal drafts, not validated or licensed clinical scales.
- Results are descriptive and intended only to help offer appropriate follow-up. They are not a diagnosis, a validated severity score, or a fitness-for-work decision.
- The overall OPRI/OPF indices and automatic clinical classification are retired/disabled.
- Do not use real worker responses until privacy, access controls, retention, professional review, and a staffed human safety-response process are approved and tested.
- Keep this work on the draft branch. Do not merge or deploy it to production as part of routine testing.

## Main files

- `index.html` — Arabic RTL application shell, consent, and privacy/scope notices
- `styles.css` — responsive presentation
- `app.js` — login, questionnaire navigation, submission, and authorized admin views
- `assessment-config.js` — 42-item questionnaire and response options
- `scoring-engine.js` — client-side draft preview logic; not a clinical scoring instrument
- `supabase.js` — public browser client configuration (publishable key only; never put a service-role/secret key here)
- `supabase/functions/fieldmind-submit-assessment/index.ts` — authenticated server-side validation, draft follow-up summary, and trusted insert
- `supabase/functions/fieldmind-admin-users/index.ts` — privileged user/role workflow
- `supabase/functions/fieldmind-superadmin-results/index.ts` — privileged result metadata workflow
- `supabase/migrations/` — reviewed, versioned database changes; each migration must be checked before application
- `tests/assessment-engine.test.cjs` — automated consistency and behavior checks
- `.github/workflows/validate.yml` — JavaScript syntax, questionnaire tests, and Edge Function type checks

## Development and checks

The draft pull request is **not merged**. GitHub Actions is configured to validate the draft branch and pull requests targeting `main`.

The JavaScript checks run with Node.js:

```bash
node --check app.js
node --check assessment-config.js
node --check scoring-engine.js
node --check supabase.js
node tests/assessment-engine.test.cjs
```

The Edge Functions are type-checked with Deno by GitHub Actions. A local static server may be used for browser testing; opening `index.html` as a `file://` URL can interfere with authentication and network requests.

## Supabase and deployment safety

- Use a dedicated **staging** Supabase project for testing. Confirm the project URL before any deployment or database change.
- The browser must use only the Supabase publishable key. The service-role key must remain in Edge Function secrets.
- The submission Edge Function checks the caller's session, questionnaire version, exact answer IDs, allowed answer values, and explicit consent; it generates the saved draft result server-side.
- The migration `supabase/migrations/202610290001_require_server_assessment_submission.sql` is a deployment gate. Review and test it in staging first; verify direct client inserts are denied and the server submission still succeeds before considering any production change.
- `schema.sql` is a fresh-install template, not a live migration. Do not run it against an existing live database.
- Before pilot use, verify that users can read only their own records, privileged functions reject non-authorized callers, safety responses have an approved human follow-up path, and data retention/deletion and audit controls are documented.

## Safety and privacy

Use synthetic test accounts and synthetic answers while validating the workflow. Do not enter identifiable employee details or real sensitive psychological responses until the organization has approved the purpose, consent language, access roles, retention period, and response process. No automated result should be used by itself for employment, medical, or fitness-for-work decisions.
