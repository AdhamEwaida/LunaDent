# LunaDent Dental Clinic SaaS

LunaDent is a multi-tenant dental clinic SaaS platform built with React, TypeScript, Vite, Tailwind CSS, Supabase, and Vercel.

It has two products in one codebase:

- **LunaDent SaaS** — the commercial landing page and Super Admin control center used to sell and provision clinics.
- **Clinic Workspaces** — isolated clinic operations, patient portals, and branded public websites for each customer clinic.

## Roles

Authorization is intentionally split into two levels.

### Platform

- **Super Admin** — manages clinics, plans, subscriptions, themes, SaaS leads, activation/suspension, and commercial platform configuration.

The Super Admin does not automatically bypass clinical RLS just because they own the SaaS.

### Clinic

- **Clinic Owner**
- **Dentist**
- **Receptionist**
- **Accountant**
- **Patient**

Clinic permissions are stored in `clinic_memberships`, so one Auth user can belong to different clinics with different roles.

## Multi-tenancy

Every clinical/business domain row is scoped by `clinic_id`, including patients, doctors, treatments, appointments, clinical notes, dental charts, treatment plans, invoices, payments, inventory, documents, and booking requests.

Supabase RLS restricts users to their clinic membership or their own patient record. Tenant-aware composite foreign keys also prevent cross-clinic references at the database integrity layer.

## Clinic provisioning

The Super Admin can create a customer clinic from `/super-admin` with:

- Clinic name and slug
- Owner name/email
- Temporary password
- Plan
- Starting website theme
- Currency and timezone

A new owner follows:

`Temporary Password → Change Password → Clinic Setup → Choose Theme → Branding → Website Builder`

## Website Builder

Every clinic has an independent public website at:

`/c/<clinic-slug>`

The current reusable theme library includes:

- **Modern**
- **Luxury**
- **Clinical**

Clinic Owners can customize without editing code:

- Theme
- Primary / secondary / accent / background / surface / text colors
- Heading and body fonts
- Heading/body scale
- Content width
- Section spacing
- Hero height
- Navigation height
- Button radius
- Card radius
- Logo and hero image
- Clinic identity/contact details
- Hero copy and CTA labels
- Treatments section copy
- Doctors section copy
- Patient journey copy
- Booking CTA copy
- Contact copy
- Section visibility
- Section ordering
- Draft / published state

Theme defaults live in `themes.default_tokens`; clinic overrides live in `clinic_site_settings`.

## Clinic operations

The clinic workspace includes:

- Patient CRM and medical history
- Dental chart
- Clinical notes
- Treatment plans
- Appointments
- Booking requests
- Doctors and treatment catalog
- Accounting / invoices / payments
- Inventory
- Staff account administration
- Patient portal
- Private patient documents

## Patient portal

Patient access is clinic-specific:

`/c/<clinic-slug>/patient/login`

One Auth account may have separate patient records in multiple clinics.

## Storage

- `patient-files` — private, tenant/patient scoped
- `clinic-assets` — public website assets, write-scoped to the Clinic Owner's tenant prefix

The frontend uses only a Supabase publishable key. Service-role access exists only inside Supabase Edge Functions.

## Supabase

Start with the base clinical schema:

`supabase/schema.sql`

Then apply the SaaS layer in order:

1. `supabase/saas/001_core.sql`
2. `supabase/saas/002_rls.sql`
3. `supabase/saas/003_functions_storage.sql`

See `supabase/saas/README.md` for the authorization model and verification notes.

Tracked Edge Functions:

- `manage-clinic-users`
- `manage-saas`
- `claim-initial-admin` — intentionally closed; bootstrap is no longer part of the product

Generated production DB types are committed at:

`src/lib/database.types.ts`

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- PostgreSQL
- Supabase Storage
- Supabase Edge Functions
- Vercel

## Local setup

1. Install dependencies: `npm ci`
2. Copy `.env.example` to `.env.local`
3. Configure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Run: `npm run dev`

Never commit a Supabase secret/service-role key.

## Verification gate

Before production changes:

```bash
npx tsc --noEmit
npm run build
npm audit --omit=dev --audit-level=moderate
```

The SaaS conversion was also verified with cross-tenant RLS tests and Supabase Security/Performance Advisors.

## Production

Production is deployed through Vercel from `main`.

Live platform: https://lunadent.vercel.app
