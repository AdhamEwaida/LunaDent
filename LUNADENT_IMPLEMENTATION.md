# LunaDent Dental Clinic Management System

## Current architecture

The original LunaDent visual prototype is preserved. A real clinic domain and data layer now sits behind the existing UI so the application can run in two modes:

- Preview mode: local demo data is used when Supabase environment variables are missing.
- Supabase mode: PostgreSQL, Supabase Auth, Row Level Security, RPC transactions, and private Storage are used when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured.

## Implemented in this iteration

### Authentication and authorization

- Supabase browser client using publishable keys only.
- Staff authentication with real email/password sign-in when Supabase is configured.
- Protected admin and accounting routes.
- Role-aware navigation and route access for `admin`, `dentist`, `receptionist`, `accountant`, and `patient`.
- Real patient portal authentication when Supabase is configured.
- Preview fallbacks remain available without a backend so the visual project is still inspectable.

### Patients and clinical records

- Patient create, search, read, and update repository operations.
- Dynamic patient workspace at `/admin/patients/:patientId`.
- Patient demographics separated from sensitive medical history at the database level.
- Medical history is stored in its own table with stricter RLS.
- Adult FDI odontogram with tooth conditions and clinical history.
- Treatment plans and clinical notes.
- Role-aware clinical UI: receptionist/accountant roles do not receive clinical tabs.
- Patient-specific appointments and finance summary.

### Appointments and booking workflow

- Staff appointment list and appointment creation form.
- Appointment links to patient, doctor, treatment, chair/room, time, duration, status, and notes.
- Public booking form now captures the real visitor name/contact details instead of the previous hardcoded demo identity.
- Public requests are persisted to `booking_requests` before the optional WhatsApp handoff.
- Reception workflow for New / Contacted / Converted / Closed booking requests.

### Billing and accounting

- Live accounting screen when Supabase is configured.
- Invoice listing and creation.
- Payment recording against invoices.
- Billing, collected, and outstanding totals.
- Atomic PostgreSQL RPCs for simple invoice creation and invoice payment recording.
- Overpayment protection and invoice status updates inside the database transaction.
- Demo accounting UI remains available in Preview mode.

### Patient portal

- Real patient login in Supabase mode.
- Patient record resolution through `auth_user_id`.
- RLS-scoped appointments, treatment plans, invoices, payments, and patient-visible documents.
- Signed private document links.
- Real logout.
- The original visual portal remains available only as Preview mode when no Supabase project is configured.

### Inventory

- Inventory listing with low-stock detection.
- Database tables for inventory items and stock transactions.
- Role-based inventory policies prepared for operational use.

### Database and storage

The schema includes:

- `profiles`
- `patients`
- `patient_medical_history`
- `doctors`
- `treatments`
- `rooms`
- `appointments`
- `clinical_notes`
- `dental_chart_entries`
- `treatment_plans`
- `treatment_plan_items`
- `invoices`
- `invoice_items`
- `payments`
- `inventory_items`
- `inventory_transactions`
- `patient_documents`
- `booking_requests`
- `audit_logs`

Security includes:

- Row Level Security on exposed application tables.
- Separate clinical permissions from front-desk and accounting access.
- Private helper schema for current application-role resolution.
- Private `patient-files` Storage bucket policies.
- Public users may create booking requests but cannot read them.
- Public users may read only active public-facing doctors/treatments.
- No secret or service-role key is used in frontend code.

## Important routes

- `/staff/login`
- `/admin/patients`
- `/admin/patients/:patientId`
- `/admin/appointments`
- `/admin/treatment-plans`
- `/admin/inventory`
- `/admin/leads`
- `/accounting`
- `/patient-portal`
- `/booking`

## Supabase setup

Create a dedicated Supabase project for LunaDent. Do not reuse unrelated projects.

Copy `.env.example` to `.env.local` and set:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Apply `supabase/schema.sql` to a development database first. Create the initial Auth account in a trusted environment and assign the required application role to its profile.

Never put a secret or service-role key in the Vite frontend.

## Verification status

- Local source import paths were checked with no missing local imports found.
- All TypeScript/TSX source files were parsed with zero syntax diagnostics in the last source verification pass.
- The code was reviewed for obvious embedded environment secrets; only `.env.example` is included.
- A complete Vite production build could not be executed in the current container because the environment cannot resolve `registry.npmjs.org`, so npm dependencies cannot be installed here.
- The database schema has not been applied to a live Supabase project because the connected account does not currently contain a dedicated LunaDent project.
- Existing unrelated Supabase projects were intentionally left untouched.
- Supabase security/performance advisors cannot be run until the schema is applied to a LunaDent development project.

## Remaining production work

The current code establishes the first functional system core. The following work is still required before describing the product as production-ready:

- Dedicated LunaDent Supabase project, schema application, generated database types, and live integration verification.
- Medical-history editing UI with field-level validation and change auditing.
- Rich treatment-plan line item editor, approvals, and conversion from treatment plan to invoice.
- Full document upload UI for X-rays, consent forms, photos, and attachments.
- Doctor working-hours management, calendar conflict prevention, chair availability, reminders, cancellations, and no-show workflow.
- Inventory transaction UI, automatic stock movement, expiry/batch workflows, and purchasing/supplier workflow.
- More complete accounting: refunds, expenses, installment plans, statements, exports, reconciliation, and reporting.
- Audit-log triggers for sensitive record changes.
- Full Arabic/English content architecture and RTL QA across staff and patient interfaces.
- Unit, integration, database-policy, and browser E2E tests against a dedicated development backend.
- Production build, browser QA, accessibility review, backup/recovery setup, and deployment hardening.

## Scope statement

This is no longer only a visual dental website prototype. It now contains a backend-ready dental clinic system core with real data boundaries and workflows. It should still be treated as an implementation phase, not a final certified production release, until the remaining live-backend and QA work above is completed.
