# LunaDent

LunaDent is a production-oriented dental clinic platform built with React, TypeScript, Vite, Tailwind CSS, Supabase, and Vercel.

## What the project includes

- Public dental clinic website
- Online appointment requests
- Staff authentication and role-based access
- Patient records and medical history
- Dental chart and clinical notes
- Treatment plans
- Appointment management
- Invoices and payments
- Inventory tracking
- Secure patient portal
- Private patient documents
- Supabase Row Level Security (RLS)
- Supabase Edge Functions for clinic user administration

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth / PostgreSQL / Storage / Edge Functions
- Vercel

## Local setup

1. Install dependencies:

   `npm ci`

2. Copy the environment template:

   `cp .env.example .env.local`

3. Configure:

   `VITE_SUPABASE_URL`

   `VITE_SUPABASE_PUBLISHABLE_KEY`

4. Start development:

   `npm run dev`

## Verification

Run before merging production changes:

```bash
npx tsc --noEmit
npm run build
npm audit --omit=dev --audit-level=moderate
```

## Production

Production is deployed through Vercel from the `main` branch.

Live site: https://lunadent.vercel.app

## Security

The frontend uses only the Supabase publishable key. Server-level secrets must never be committed to the repository or exposed through Vite environment variables.

All exposed application tables should remain protected by Supabase RLS policies.
