-- FieldMind security migration: require the server submission function for new assessment inserts.
-- Review against the live schema and test in staging before applying to production.
-- Existing SELECT policies remain unchanged.
REVOKE INSERT ON TABLE public.assessments FROM PUBLIC;
REVOKE INSERT ON TABLE public.assessments FROM anon;
REVOKE INSERT ON TABLE public.assessments FROM authenticated;
GRANT INSERT ON TABLE public.assessments TO service_role;

-- The "workers insert own assessments" RLS policy may remain as defense-in-depth,
-- but authenticated clients no longer have the table privilege required to use it.
-- The Edge Function validates the caller's JWT, validates answers and consent,
-- calculates result server-side, then inserts with the service-role client while
-- explicitly setting user_id to the authenticated user's ID.
