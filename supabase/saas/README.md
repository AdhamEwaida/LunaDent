# LunaDent SaaS database layer

The original `supabase/schema.sql` creates the single-clinic clinical schema. The SaaS layer converts that schema into a multi-tenant platform without discarding the existing clinic data.

Apply the reviewed SQL files in this order on a fresh development project:

1. `../schema.sql`
2. `001_core.sql`
3. `002_rls.sql`
4. `003_functions_storage.sql`

Then deploy:

- `../functions/manage-clinic-users`
- `../functions/manage-saas`
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
