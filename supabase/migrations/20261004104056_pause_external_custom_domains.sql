-- The prototype uses LunaDent-managed Vercel clinic URLs for every clinic.
-- External bring-your-own-domain provisioning remains disabled until its provider
-- credential lifecycle is configured and released deliberately.

update public.plans
set features = jsonb_set(
  coalesce(features,'{}'::jsonb),
  '{custom_domain}',
  'false'::jsonb,
  true
)
where code in ('starter','pro','enterprise');
