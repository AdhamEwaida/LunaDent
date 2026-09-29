# LunaDent Supabase setup

This folder contains a database schema for a dedicated LunaDent Supabase project.

1. Create a separate Supabase project for LunaDent.
2. Apply `schema.sql` in a development database first.
3. Create the first Auth user, then promote that user's `profiles.role` to `admin` using a trusted admin workflow or the SQL editor.
4. Add the project URL and publishable key to `.env.local` using the names in `.env.example`.
5. Run the application and verify login, patient CRUD, clinical access, appointments, storage, and RLS policies.
6. Run Supabase security and performance advisors before production.

Never expose a secret or service-role key in the Vite frontend.
