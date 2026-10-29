# FieldMind internal pilot — test and privacy checklist

**Status:** Draft only. Do not use with real worker responses until the checks below are completed and signed off.

## A. Functional testing in a non-production environment

### Environment gate — resolve before browser testing
- [ ] Confirm the deployed page's origin and the exact Supabase project reference it uses; never infer the environment from the page title.
- [ ] The tracked `supabase.js` currently points to the production project reference. Do not use that tracked configuration for staging tests or point a public test page at staging without an explicit environment plan.
- [ ] The developer's local `supabase.js` override is uncommitted and must remain separate from tracked release files until a reviewed staging configuration strategy is implemented.
- [ ] The Edge Functions currently allow the GitHub Pages origin `https://raeddwik.github.io`. Localhost browser tests require a deliberately configured exact-origin allowlist; do not use wildcard CORS as a workaround.
- [ ] Never paste a service-role key into browser code, GitHub files, issues, or chat. Only publishable keys belong in `supabase.js`.
- [ ] Keep `supabase/.temp/` local and untracked; do not commit CLI cache or temporary credentials.


- [ ] Open the application and confirm Arabic/RTL layout, login, logout, and session refresh work.
- [ ] Confirm all 42 items appear once, in the intended order, with correct response labels.
- [ ] Confirm Previous/Next preserves the selected answer.
- [ ] Confirm submission is blocked if any item has no answer.
- [ ] Confirm “أفضل عدم الإجابة” is available for sensitive yes/no items and is not treated as “لا”.
- [ ] Submit a synthetic all-zero response set; verify the output is descriptive only and does not say “no disorder”.
- [ ] Submit synthetic moderate and high frequency response sets; verify only the intended follow-up labels change.
- [ ] Submit synthetic positive answers to bipolar-related and psychosis-related flags; verify the output says specialist review may be useful and does not name a diagnosis.
- [ ] Submit synthetic positive answers to each safety item; verify the correct human-review message appears.
- [ ] Submit synthetic “prefer not to answer” responses to safety items; verify the result does not infer that risk is absent or present.
- [ ] Confirm a database error is shown safely and no success message appears unless the save succeeds.
- [ ] Confirm the saved record has the correct questionnaire version and contains no extra identifiers beyond the approved design.

## B. Privacy and access controls (Supabase)

- [ ] Review Row Level Security (RLS) for `assessments`, `user_roles`, and every table used by the app.
- [ ] Verify a worker can read only their own records, if worker read access is required at all.
- [ ] Verify a normal user cannot read other workers' answers or results.
- [ ] Verify admin and super-admin access is limited to explicitly approved roles and is enforced by database policies—not only by hidden UI elements.
- [ ] Review Edge Functions, exports, logs, backups, and any dashboard queries for unintended access to sensitive answers.
- [ ] Verify the publishable key is the only Supabase key shipped to the browser; never expose a service-role key in frontend code.
- [ ] Define retention/deletion, incident handling, access logging, and who can export or delete responses.
- [ ] Confirm the privacy notice accurately states who can access data, why it is collected, how long it is retained, and how workers can request support or exercise their rights.

## C. Human follow-up and safety

- [ ] Name a qualified person/team responsible for reviewing follow-up flags.
- [ ] Set a realistic review timeframe and a secure contact route.
- [ ] Write an approved response protocol for imminent danger and self-harm disclosures; do not rely on the software alone.
- [ ] Ensure workers can ask for help regardless of their score and can decline sensitive answers without punishment.
- [ ] Explain the limits of confidentiality, including any narrowly defined safety/legal exceptions, before collecting responses.
- [ ] Do not use this questionnaire alone for diagnosis, employment decisions, fitness-for-work decisions, discipline, or promotion.

## D. Review and release decision

- [ ] Review Arabic wording with occupational health and mental-health professionals.
- [ ] Review the draft scoring rules and confirm that the labels are described as internal follow-up priorities, not clinical severity.
- [ ] Run all checks in a staging environment and record results.
- [ ] Obtain explicit approval from the responsible data/privacy owner and the clinical/occupational-health owner before any pilot with real data.

## E. Code-review observations to verify in staging

These are review findings from the repository code, not proof of live database behavior.

- [ ] **Service-role boundary:** `fieldmind-submit-assessment`, `fieldmind-admin-users`, and `fieldmind-superadmin-results` use a service-role client. Confirm their server-side authorization and input validation remain mandatory because service-role operations can bypass ordinary RLS protections.
- [ ] **Admin page access path:** `app.js` loads some admin records directly from `public.assessments`, while the super-admin dashboard uses a protected Edge Function. Confirm the direct query is either intentionally permitted by a narrowly scoped RLS policy or remove/disable it in a later reviewed change; hiding the panel is not a security boundary.
- [ ] **Role integrity:** verify database constraints and policies ensure a user cannot insert or modify their own `user_roles` rows or grant themselves `admin`/`super_admin`.
- [ ] **Migration behavior:** the migration revokes INSERT grants from `PUBLIC`, `anon`, and `authenticated`, then grants INSERT to `service_role`. Verify it applies cleanly to the existing staging schema and does not unintentionally change SELECT behavior.
- [ ] **Human safety process:** the application can display a safety notice, but it does not itself guarantee a person receives or acts on an alert. Confirm an actual staffed follow-up process exists before any real-data pilot.
- [ ] **CORS and environment:** all three functions currently allow `https://raeddwik.github.io`; verify this is the intended host for the staging build, and avoid wildcard CORS.

## Known limitations

- This is a custom, owner-designed questionnaire draft, not a validated or licensed clinical scale.
- Its thresholds are provisional and have not been evaluated against a clinical reference assessment.
- A negative response pattern cannot rule out a mental-health condition or safety concern.
- The questionnaire is not a diagnostic tool and does not determine fitness for work.
