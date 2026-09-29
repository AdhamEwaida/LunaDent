-- LunaDent Studio - production-oriented PostgreSQL/Supabase schema
-- Apply this to a dedicated LunaDent Supabase project, never to an unrelated project.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'dentist', 'receptionist', 'accountant', 'patient');
create type public.patient_status as enum ('active', 'inactive', 'archived');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'checked_in', 'in_treatment', 'completed', 'cancelled', 'no_show');
create type public.tooth_condition as enum ('healthy', 'caries', 'filling', 'crown', 'implant', 'missing', 'extraction', 'root_canal', 'bridge', 'veneer', 'fracture');
create type public.chart_record_status as enum ('existing', 'planned', 'completed');
create type public.plan_status as enum ('draft', 'proposed', 'approved', 'in_progress', 'completed', 'cancelled');
create type public.plan_item_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'void');
create type public.booking_request_status as enum ('new', 'contacted', 'converted', 'closed');

create sequence public.patient_number_seq start 1001;
create sequence public.invoice_number_seq start 1001;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'patient',
  full_name text,
  phone text,
  avatar_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  patient_no text not null unique default ('PT-' || lpad(nextval('public.patient_number_seq')::text, 6, '0')),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  sex text check (sex in ('male', 'female', 'other')),
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  status public.patient_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_medical_history (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  blood_type text,
  allergies text,
  chronic_conditions text,
  current_medications text,
  dental_history text,
  clinical_summary text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  display_name text not null,
  specialty text,
  phone text,
  email text,
  license_number text,
  bio_en text,
  bio_ar text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ar text,
  description_en text,
  description_ar text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  default_price numeric(12,2) not null default 0 check (default_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid references public.doctors(id) on delete set null,
  treatment_id uuid references public.treatments(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  room text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  cancellation_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  note_type text not null default 'progress' check (note_type in ('progress', 'diagnosis', 'procedure', 'follow_up')),
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dental_chart_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  tooth_no integer not null check (tooth_no between 11 and 85),
  condition public.tooth_condition not null,
  surfaces text[] not null default '{}',
  status public.chart_record_status not null default 'existing',
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now()
);

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  status public.plan_status not null default 'draft',
  estimated_total numeric(12,2) not null default 0 check (estimated_total >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid not null references public.treatment_plans(id) on delete cascade,
  treatment_id uuid references public.treatments(id) on delete set null,
  tooth_no integer,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  status public.plan_item_status not null default 'planned',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  treatment_plan_id uuid references public.treatment_plans(id) on delete set null,
  invoice_no text not null unique default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')),
  status public.invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_total numeric(12,2) not null default 0,
  balance_due numeric(12,2) generated always as (greatest(total - paid_total, 0)) stored,
  issued_at timestamptz,
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  tooth_no integer,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'other')),
  reference text,
  paid_at timestamptz not null default now(),
  received_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text,
  quantity numeric(12,2) not null default 0,
  unit text,
  minimum_stock numeric(12,2) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  supplier text,
  batch_no text,
  expiry_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('receive', 'consume', 'adjust', 'waste')),
  quantity numeric(12,2) not null check (quantity > 0),
  appointment_id uuid references public.appointments(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  document_type text not null default 'other',
  title text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  patient_visible boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  treatment_id uuid references public.treatments(id) on delete set null,
  requested_treatment text,
  requested_doctor text,
  preferred_date date,
  preferred_time text,
  status public.booking_request_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index patients_name_idx on public.patients (last_name, first_name);
create index patients_phone_idx on public.patients (phone);
create index appointments_start_idx on public.appointments (start_at);
create index appointments_patient_idx on public.appointments (patient_id, start_at desc);
create index clinical_notes_patient_idx on public.clinical_notes (patient_id, created_at desc);
create index dental_chart_patient_idx on public.dental_chart_entries (patient_id, tooth_no, recorded_at desc);
create index treatment_plans_patient_idx on public.treatment_plans (patient_id, created_at desc);
create index invoices_patient_idx on public.invoices (patient_id, created_at desc);
create index payments_patient_idx on public.payments (patient_id, paid_at desc);
create index inventory_expiry_idx on public.inventory_items (expiry_date) where active = true;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.active = true;
$$;
revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'patient', coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger patients_updated_at before update on public.patients for each row execute function public.set_updated_at();
create trigger patient_medical_history_updated_at before update on public.patient_medical_history for each row execute function public.set_updated_at();
create trigger doctors_updated_at before update on public.doctors for each row execute function public.set_updated_at();
create trigger treatments_updated_at before update on public.treatments for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger clinical_notes_updated_at before update on public.clinical_notes for each row execute function public.set_updated_at();
create trigger treatment_plans_updated_at before update on public.treatment_plans for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger inventory_items_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_medical_history enable row level security;
alter table public.doctors enable row level security;
alter table public.treatments enable row level security;
alter table public.rooms enable row level security;
alter table public.appointments enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.dental_chart_entries enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.patient_documents enable row level security;
alter table public.booking_requests enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));

create policy patients_staff_read on public.patients for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy patients_patient_read on public.patients for select to authenticated using (auth_user_id = (select auth.uid()));
create policy patients_staff_insert on public.patients for insert to authenticated with check (private.current_user_role() in ('admin','dentist','receptionist'));
create policy patients_staff_update on public.patients for update to authenticated using (private.current_user_role() in ('admin','dentist','receptionist')) with check (private.current_user_role() in ('admin','dentist','receptionist'));
create policy patients_admin_delete on public.patients for delete to authenticated using (private.current_user_role() = 'admin');

create policy medical_history_clinical_read on public.patient_medical_history for select to authenticated using (private.current_user_role() in ('admin','dentist'));
create policy medical_history_patient_read on public.patient_medical_history for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy medical_history_clinical_insert on public.patient_medical_history for insert to authenticated with check (private.current_user_role() in ('admin','dentist'));
create policy medical_history_clinical_update on public.patient_medical_history for update to authenticated using (private.current_user_role() in ('admin','dentist')) with check (private.current_user_role() in ('admin','dentist'));
create policy medical_history_admin_delete on public.patient_medical_history for delete to authenticated using (private.current_user_role() = 'admin');

create policy doctors_anon_read on public.doctors for select to anon using (active = true);
create policy doctors_authenticated_read on public.doctors for select to authenticated using (active = true or private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy doctors_admin_write on public.doctors for all to authenticated using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');

create policy treatments_anon_read on public.treatments for select to anon using (active = true);
create policy treatments_authenticated_read on public.treatments for select to authenticated using (active = true or private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy treatments_admin_write on public.treatments for all to authenticated using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');

create policy rooms_staff_read on public.rooms for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy rooms_admin_write on public.rooms for all to authenticated using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');

create policy appointments_staff_read on public.appointments for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy appointments_patient_read on public.appointments for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy appointments_staff_insert on public.appointments for insert to authenticated with check (private.current_user_role() in ('admin','dentist','receptionist'));
create policy appointments_staff_update on public.appointments for update to authenticated using (private.current_user_role() in ('admin','dentist','receptionist')) with check (private.current_user_role() in ('admin','dentist','receptionist'));
create policy appointments_admin_delete on public.appointments for delete to authenticated using (private.current_user_role() = 'admin');

create policy clinical_notes_clinical_read on public.clinical_notes for select to authenticated using (private.current_user_role() in ('admin','dentist'));
create policy clinical_notes_clinical_insert on public.clinical_notes for insert to authenticated with check (private.current_user_role() in ('admin','dentist'));
create policy clinical_notes_clinical_update on public.clinical_notes for update to authenticated using (private.current_user_role() in ('admin','dentist')) with check (private.current_user_role() in ('admin','dentist'));
create policy clinical_notes_admin_delete on public.clinical_notes for delete to authenticated using (private.current_user_role() = 'admin');

create policy chart_clinical_read on public.dental_chart_entries for select to authenticated using (private.current_user_role() in ('admin','dentist'));
create policy chart_clinical_insert on public.dental_chart_entries for insert to authenticated with check (private.current_user_role() in ('admin','dentist'));
create policy chart_clinical_update on public.dental_chart_entries for update to authenticated using (private.current_user_role() in ('admin','dentist')) with check (private.current_user_role() in ('admin','dentist'));
create policy chart_admin_delete on public.dental_chart_entries for delete to authenticated using (private.current_user_role() = 'admin');

create policy plans_staff_read on public.treatment_plans for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy plans_patient_read on public.treatment_plans for select to authenticated using (status <> 'draft' and exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy plans_clinical_insert on public.treatment_plans for insert to authenticated with check (private.current_user_role() in ('admin','dentist'));
create policy plans_clinical_update on public.treatment_plans for update to authenticated using (private.current_user_role() in ('admin','dentist')) with check (private.current_user_role() in ('admin','dentist'));
create policy plans_admin_delete on public.treatment_plans for delete to authenticated using (private.current_user_role() = 'admin');

create policy plan_items_staff_read on public.treatment_plan_items for select to authenticated using (exists (select 1 from public.treatment_plans p where p.id = treatment_plan_id));
create policy plan_items_clinical_write on public.treatment_plan_items for all to authenticated using (private.current_user_role() in ('admin','dentist')) with check (private.current_user_role() in ('admin','dentist'));

create policy invoices_staff_read on public.invoices for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy invoices_patient_read on public.invoices for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy invoices_finance_write on public.invoices for all to authenticated using (private.current_user_role() in ('admin','receptionist','accountant')) with check (private.current_user_role() in ('admin','receptionist','accountant'));

create policy invoice_items_staff_read on public.invoice_items for select to authenticated using (exists (select 1 from public.invoices i where i.id = invoice_id));
create policy invoice_items_finance_write on public.invoice_items for all to authenticated using (private.current_user_role() in ('admin','receptionist','accountant')) with check (private.current_user_role() in ('admin','receptionist','accountant'));

create policy payments_staff_read on public.payments for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy payments_patient_read on public.payments for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy payments_finance_write on public.payments for all to authenticated using (private.current_user_role() in ('admin','receptionist','accountant')) with check (private.current_user_role() in ('admin','receptionist','accountant'));

create policy inventory_staff_read on public.inventory_items for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy inventory_admin_reception_write on public.inventory_items for all to authenticated using (private.current_user_role() in ('admin','receptionist')) with check (private.current_user_role() in ('admin','receptionist'));
create policy inventory_transactions_staff_read on public.inventory_transactions for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist','accountant'));
create policy inventory_transactions_staff_insert on public.inventory_transactions for insert to authenticated with check (private.current_user_role() in ('admin','dentist','receptionist'));

create policy documents_staff_read on public.patient_documents for select to authenticated using (private.current_user_role() in ('admin','dentist','receptionist'));
create policy documents_patient_read on public.patient_documents for select to authenticated using (patient_visible = true and exists (select 1 from public.patients p where p.id = patient_id and p.auth_user_id = (select auth.uid())));
create policy documents_clinical_write on public.patient_documents for all to authenticated using (private.current_user_role() in ('admin','dentist','receptionist')) with check (private.current_user_role() in ('admin','dentist','receptionist'));

create policy booking_public_insert on public.booking_requests for insert to anon, authenticated with check (true);
create policy booking_staff_read on public.booking_requests for select to authenticated using (private.current_user_role() in ('admin','receptionist'));
create policy booking_staff_update on public.booking_requests for update to authenticated using (private.current_user_role() in ('admin','receptionist')) with check (private.current_user_role() in ('admin','receptionist'));
create policy booking_admin_delete on public.booking_requests for delete to authenticated using (private.current_user_role() = 'admin');

create policy audit_admin_read on public.audit_logs for select to authenticated using (private.current_user_role() = 'admin');

revoke all on all tables in schema public from anon, authenticated;
grant select on public.doctors, public.treatments to anon;
grant insert on public.booking_requests to anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.patients, public.patient_medical_history to authenticated;
grant select, insert, update, delete on public.doctors, public.treatments, public.rooms to authenticated;
grant select, insert, update, delete on public.appointments, public.clinical_notes, public.dental_chart_entries to authenticated;
grant select, insert, update, delete on public.treatment_plans, public.treatment_plan_items to authenticated;
grant select, insert, update, delete on public.invoices, public.invoice_items, public.payments to authenticated;
grant select, insert, update, delete on public.inventory_items, public.inventory_transactions to authenticated;
grant select, insert, update, delete on public.patient_documents, public.booking_requests to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.patient_number_seq, public.invoice_number_seq to authenticated;

insert into storage.buckets (id, name, public)
values ('patient-files', 'patient-files', false)
on conflict (id) do nothing;

create policy patient_files_staff_read
on storage.objects for select to authenticated
using (bucket_id = 'patient-files' and private.current_user_role() in ('admin','dentist','receptionist'));

create policy patient_files_patient_read
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-files'
  and exists (
    select 1 from public.patients p
    where p.id::text = (storage.foldername(name))[1]
      and p.auth_user_id = (select auth.uid())
  )
);

create policy patient_files_staff_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'patient-files' and private.current_user_role() in ('admin','dentist','receptionist'));

create policy patient_files_staff_update
on storage.objects for update to authenticated
using (bucket_id = 'patient-files' and private.current_user_role() in ('admin','dentist','receptionist'))
with check (bucket_id = 'patient-files' and private.current_user_role() in ('admin','dentist','receptionist'));

create policy patient_files_staff_delete
on storage.objects for delete to authenticated
using (bucket_id = 'patient-files' and private.current_user_role() in ('admin','dentist'));

insert into public.rooms (name) values ('Chair 1'), ('Chair 2'), ('Surgery Room') on conflict do nothing;
insert into public.treatments (code, name_en, name_ar, duration_minutes, default_price) values
  ('CONSULT', 'Dental Consultation', 'استشارة أسنان', 30, 80),
  ('FILL', 'Composite Filling', 'حشوة تجميلية', 45, 180),
  ('RCT', 'Root Canal Treatment', 'علاج عصب', 90, 650),
  ('CROWN', 'Ceramic Crown', 'تلبيسة سيراميك', 60, 950),
  ('IMPLANT', 'Dental Implant', 'زراعة أسنان', 90, 1800),
  ('WHITEN', 'Teeth Whitening', 'تبييض الأسنان', 60, 400)
on conflict (code) do nothing;

-- Atomic finance helpers. SECURITY INVOKER keeps RLS and caller permissions active.
create or replace function public.create_simple_invoice(
  p_patient_id uuid,
  p_description text,
  p_amount numeric,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_invoice_id uuid;
begin
  if private.current_user_role() not in ('admin','receptionist','accountant') then
    raise exception 'not authorized to create invoices';
  end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  insert into public.invoices (patient_id, status, subtotal, total, issued_at, due_at, created_by)
  values (p_patient_id, 'issued', p_amount, p_amount, now(), p_due_at, (select auth.uid()))
  returning id into v_invoice_id;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price, line_total)
  values (v_invoice_id, p_description, 1, p_amount, p_amount);
  return v_invoice_id;
end;
$$;
revoke all on function public.create_simple_invoice(uuid,text,numeric,timestamptz) from public, anon;
grant execute on function public.create_simple_invoice(uuid,text,numeric,timestamptz) to authenticated;

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_new_paid numeric;
begin
  if private.current_user_role() not in ('admin','receptionist','accountant') then
    raise exception 'not authorized to record payments';
  end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_method not in ('cash','card','bank_transfer','other') then raise exception 'invalid payment method'; end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then raise exception 'invoice not found'; end if;
  if v_invoice.status = 'void' then raise exception 'cannot pay a void invoice'; end if;
  if p_amount > v_invoice.balance_due then raise exception 'payment exceeds outstanding balance'; end if;

  insert into public.payments (patient_id, invoice_id, amount, method, reference, received_by)
  values (v_invoice.patient_id, v_invoice.id, p_amount, p_method, p_reference, (select auth.uid()))
  returning id into v_payment_id;

  v_new_paid := v_invoice.paid_total + p_amount;
  update public.invoices
  set paid_total = v_new_paid,
      status = case when v_new_paid >= total then 'paid'::public.invoice_status else 'partially_paid'::public.invoice_status end
  where id = v_invoice.id;

  return v_payment_id;
end;
$$;
revoke all on function public.record_invoice_payment(uuid,numeric,text,text) from public, anon;
grant execute on function public.record_invoice_payment(uuid,numeric,text,text) to authenticated;
