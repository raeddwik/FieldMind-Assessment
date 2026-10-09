# FieldMind — Occupational Mental Health Assessment

A starter PWA for a custom occupational mental-health assessment workflow for oil production field workers. Arabic RTL interface. Built with HTML/CSS/JavaScript, Supabase Auth, Postgres and Row Level Security.

## Important status

This is a **technical starter only**. The included questionnaire is clearly marked as demo content and does not generate a clinical score. Do not use it for actual employee screening until the scale owner's exact items, scoring rules, reverse-coded items, domain formulas, cutoffs, interpretations, and recommendations are configured and validated.

## Files

- `index.html` — Arabic RTL app shell
- `styles.css` — responsive styling
- `app.js` — login, questionnaire flow, saving, and admin list
- `supabase.js` — public browser client configuration
- `assessment-config.js` — temporary demo questions/options
- `schema.sql` — initial database tables and RLS policies
- `.github/workflows/deploy.yml` — GitHub Pages deployment workflow

## 1. Create Supabase project

1. Create a new Supabase project separate from any existing application.
2. In **Project Settings → API**, copy the Project URL and Publishable key (or legacy anon key).
3. Replace the placeholders in `supabase.js`.
4. Open **SQL Editor**, run `schema.sql`.
5. In **Authentication → URL Configuration**, add your deployed GitHub Pages URL to Site URL / Redirect URLs as appropriate.
6. Configure email authentication and SMTP/delivery settings before real use.

Never use a `service_role` or secret key in frontend JavaScript.

## 2. Load the assessment configuration

`assessment-config.js` must be loaded before `app.js`. Add this line in `index.html` immediately before `app.js`:

```html
<script src="./assessment-config.js"></script>
<script src="./app.js"></script>
```

This file is intentionally separate so the owner's approved scale can replace the demo items without changing the UI engine.

## 3. Deploy to GitHub Pages

1. Create a new repository, for example `FieldMind-Assessment`.
2. Upload all files and folders in this project to the repository root.
3. Open **Settings → Pages** and choose **GitHub Actions** as the build/deployment source.
4. Push to `main` or run the workflow manually.
5. Open the published URL and test with non-sensitive test accounts.

## 4. Create the first administrator

First sign in once with the intended admin email so the user exists in Supabase Auth. Find that user's UUID in **Authentication → Users**. Then run this SQL in the SQL Editor, replacing the UUID:

```sql
insert into public.user_roles (user_id, role)
values ('REPLACE-WITH-AUTH-USER-UUID', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Do not create an admin assignment form in the public frontend. Only a trusted project administrator should assign roles.

## 5. Important implementation notes

- The first version saves submitted answers and a placeholder result status. Scoring is not implemented until the approved scale specification is provided.
- Admin table displays user UUID and record status only. It does not expose email or detailed answers in the list.
- A user can read only their own records; an administrator can read all assessment records.
- Email delivery of result summaries is a later backend step. Do not send sensitive result details through an unprotected email.
- This starter does not yet implement rate limiting, audit logs, data retention/deletion workflows, or a clinical escalation pathway. Add and test these before production.
- GitHub Pages is static hosting; privileged operations must run in a secure backend or Supabase Edge Function, never in the browser.
