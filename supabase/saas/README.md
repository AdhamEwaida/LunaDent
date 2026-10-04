# LunaDent SaaS database layer

The original `supabase/schema.sql` creates the single-clinic clinical schema. The SaaS layer converts that schema into a multi-tenant platform without discarding the existing clinic data.

Apply the reviewed SQL files in this order on a fresh development project:

1. `../schema.sql`
2. `001_core.sql`
3. `002_rls.sql`
4. `003_functions_storage.sql`
5. `004_entitlements.sql`
6. `005_booking_foundation.sql`
7. `006_commercial_guards.sql`
8. `007_clinical_workflows.sql`
9. `008_booking_audit_professional.sql`
10. `009_custom_domains.sql`

Then deploy:

- `../functions/manage-clinic-users` with JWT verification enabled.
- `../functions/manage-saas` with JWT verification enabled.
- `../functions/manage-clinic-domain` with JWT verification enabled.
- `../functions/public-booking` with JWT verification disabled; it performs its own server-side clinic, schedule, rate-limit, doctor and treatment validation.
- `../functions/claim-initial-admin` is intentionally closed and returns HTTP 410; bootstrap is not part of the product anymore.

## Authorization model

Platform authorization and clinic authorization are separate:

- `profiles.platform_role = super_admin` is reserved for the LunaDent platform owner.
- `clinic_memberships.role` controls a user's permissions inside a particular clinic:
  - `clinic_owner`
  - `dentist`
  - `receptionist`
  - `accountant`
- Patients are associated with clinics through `patients.clinic_id` and can have separate patient rows in multiple clinics using the same Auth account.

Do not use `user_metadata` for authorization. The frontend only uses metadata for display fields.

## Tenant isolation

Every clinical/business row is scoped by `clinic_id`. Tenant-aware composite foreign keys prevent a row in one clinic from referencing a patient, doctor, treatment, appointment, invoice, plan, document, or inventory object from another clinic.

The platform Super Admin does **not** receive a blanket RLS bypass for medical records. Clinical records are visible only through a clinic membership or patient ownership.

## Website themes

`themes` contains reusable theme defaults and `clinic_site_settings` stores each clinic's selected theme and editable design/content overrides.

The current theme library contains:

- Modern
- Luxury
- Clinical

Owners can edit colors, typography, sizes, spacing, radii, images, section visibility/order, clinic contact information, and public section copy from the Website Builder.

## Storage

- `patient-files`: private. Object paths are `<clinic_id>/<patient_id>/...`; patient access also requires a matching `patient_documents` row marked `patient_visible=true`.
- `clinic-assets`: public website assets. Owners can mutate only paths under their own `<clinic_id>/...` prefix.

Never put a Supabase secret/service-role key in frontend environment variables.

## Production verification

The live Supabase project was verified after the SaaS conversion with:

- RLS cross-tenant tests for Clinic Owner, Patient, and Platform Super Admin.
- Composite tenant foreign-key mismatch checks.
- Supabase Security Advisor.
- Supabase Performance Advisor.
- Generated TypeScript DB types in `src/lib/database.types.ts`.

At the final advisor pass, the database had no RLS/function security lint, no duplicate-index warning, and no multiple-permissive-policy warning. `unused_index` remains informational because the product has little production traffic.

Supabase Auth's **Leaked Password Protection** is an account/project Auth setting and is not configured by these SQL files. Enable it from the Supabase Auth password-security settings when available on the project's plan.


## Commercial entitlements

Plan features are enforced in both the UI and PostgreSQL/RLS boundary. Accounting, inventory, website access, premium themes, staff seats and dentist seats are not presentation-only flags.

The platform currently uses `billing_provider = manual` until a payment processor is connected. Super Admin can change plan and subscription status without giving clinic users direct access to subscription records.

Custom domains are provider-backed through the authenticated `manage-clinic-domain` Edge Function. The database stores lifecycle state while Vercel remains authoritative for project-domain ownership, DNS readiness, and TLS provisioning. Starter does not include custom domains; Pro and Enterprise do.

Before enabling this function in an environment, configure the Edge Function secret `VERCEL_TOKEN` with a Vercel token scoped to the LunaDent project/team. The function also accepts optional `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`, and `LUNADENT_PLATFORM_DOMAIN` overrides. Never expose `VERCEL_TOKEN` to Vite/frontend environment variables.

Public API access and multi-location operation remain disabled until their own provisioning infrastructure is connected.

## Booking

Public booking goes through the `public-booking` Edge Function. The browser never receives service-role credentials.

Availability is computed from `clinic_business_hours`, treatment duration, optional doctor conflicts, clinic timezone, lead time and booking horizon. Public direct inserts into `booking_requests` are disabled in the final production state.

## Audit trail

Clinic owners can review tenant-scoped audit events. The audit trail records actor, action, entity identifier and changed field names. It does not duplicate patient or clinical row contents into audit metadata.
