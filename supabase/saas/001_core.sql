-- LunaDent SaaS multi-tenant extension
-- Apply after supabase/schema.sql on a fresh project.
-- This file is intentionally idempotent enough for review/dev bootstrap.
-- Production source of truth was verified against project oehvyuoswomtskcxxrua on 2026-09-30.

do $$ begin
  create type public.platform_role as enum ('user','super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.clinic_role as enum ('clinic_owner','dentist','receptionist','accountant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.clinic_status as enum ('trialing','active','suspended','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing','active','past_due','canceled','suspended');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists platform_role public.platform_role not null default 'user';

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  preview_image text,
  premium boolean not null default false,
  active boolean not null default true,
  default_tokens jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_monthly numeric(12,2) not null default 0,
  currency text not null default 'USD',
  active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  status public.clinic_status not null default 'trialing',
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  country text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  locale text not null default 'en',
  logo_path text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.clinic_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id,user_id)
);

create table if not exists public.clinic_site_settings (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  theme_key text not null default 'modern' references public.themes(key),
  published boolean not null default false,
  custom_domain text unique,
  domain_verified boolean not null default false,
  site_title text,
  tagline text,
  logo_url text,
  favicon_url text,
  hero_image_url text,
  tokens jsonb not null default '{}'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  assets jsonb not null default '{}'::jsonb,
  navigation jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  billing_provider text not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  clinic_name text,
  email text not null,
  phone text,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','qualified','converted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.themes (key,name,description,premium,active,default_tokens)
values
('modern','Modern','Clean, bright and minimal clinic website.',false,true,
 '{"colors":{"primary":"#2457C5","secondary":"#EAF1FF","accent":"#26A69A","background":"#FFFFFF","surface":"#F8FAFC","text":"#172033","muted":"#667085"},"typography":{"headingFont":"Inter","bodyFont":"Inter","headingScale":1.0,"bodyScale":1.0},"layout":{"maxWidth":1200,"sectionSpacing":88,"heroMinHeight":620,"navHeight":76,"buttonRadius":18,"cardRadius":24,"cardShadow":"soft"}}'::jsonb),
('luxury','Luxury','Editorial, premium and image-led presentation.',true,true,
 '{"colors":{"primary":"#3E2A7E","secondary":"#F8EFEA","accent":"#C9A45C","background":"#FFF9F5","surface":"#FFFFFF","text":"#241B33","muted":"#746C7E"},"typography":{"headingFont":"Cormorant Garamond","bodyFont":"Inter","headingScale":1.12,"bodyScale":1.0},"layout":{"maxWidth":1240,"sectionSpacing":104,"heroMinHeight":680,"navHeight":82,"buttonRadius":999,"cardRadius":30,"cardShadow":"medium"}}'::jsonb),
('clinical','Clinical','Professional medical layout focused on clarity and trust.',false,true,
 '{"colors":{"primary":"#0F6CBD","secondary":"#EAF6FF","accent":"#16A3A8","background":"#F8FCFF","surface":"#FFFFFF","text":"#10243E","muted":"#60748A"},"typography":{"headingFont":"Manrope","bodyFont":"Inter","headingScale":1.0,"bodyScale":1.0},"layout":{"maxWidth":1180,"sectionSpacing":80,"heroMinHeight":580,"navHeight":72,"buttonRadius":12,"cardRadius":18,"cardShadow":"subtle"}}'::jsonb)
on conflict (key) do update set
  name=excluded.name,
  description=excluded.description,
  premium=excluded.premium,
  active=excluded.active,
  default_tokens=excluded.default_tokens,
  updated_at=now();

insert into public.plans (code,name,description,price_monthly,currency,active,features,limits)
values
('starter','Starter','Core clinic operations and one website theme.',49,'USD',true,
 '{"patients":true,"appointments":true,"website":true,"patient_portal":true,"accounting":false,"inventory":false,"custom_domain":false,"all_themes":false}'::jsonb,
 '{"locations":1,"dentists":2,"staff":3,"storage_gb":5}'::jsonb),
('pro','Pro','Full clinic operations, all themes, accounting and inventory.',99,'USD',true,
 '{"patients":true,"appointments":true,"website":true,"patient_portal":true,"accounting":true,"inventory":true,"custom_domain":true,"all_themes":true}'::jsonb,
 '{"locations":1,"dentists":10,"staff":20,"storage_gb":50}'::jsonb),
('enterprise','Enterprise','Multi-location and advanced platform support.',249,'USD',true,
 '{"patients":true,"appointments":true,"website":true,"patient_portal":true,"accounting":true,"inventory":true,"custom_domain":true,"all_themes":true,"multi_location":true,"api":true}'::jsonb,
 '{"locations":25,"dentists":100,"staff":500,"storage_gb":500}'::jsonb)
on conflict (code) do update set
  name=excluded.name,
  description=excluded.description,
  price_monthly=excluded.price_monthly,
  currency=excluded.currency,
  active=excluded.active,
  features=excluded.features,
  limits=excluded.limits,
  updated_at=now();

-- Preserve any existing single-clinic data by migrating it into a first tenant.
insert into public.clinics (name,slug,status,currency,timezone,locale,onboarding_completed)
select 'LunaDent Demo Clinic','lunadent-demo','active','USD','Asia/Hebron','en',true
where not exists (select 1 from public.clinics where slug='lunadent-demo');

do $$
declare
  v_table text;
  v_clinic uuid;
begin
  select id into v_clinic from public.clinics where slug='lunadent-demo';

  foreach v_table in array array[
    'patients','patient_medical_history','doctors','treatments','rooms','appointments',
    'clinical_notes','dental_chart_entries','treatment_plans','treatment_plan_items',
    'invoices','invoice_items','payments','inventory_items','inventory_transactions',
    'patient_documents','booking_requests'
  ]
  loop
    execute format('alter table public.%I add column if not exists clinic_id uuid',v_table);
    execute format('update public.%I set clinic_id=$1 where clinic_id is null',v_table) using v_clinic;
    execute format('alter table public.%I alter column clinic_id set not null',v_table);
    begin
      execute format(
        'alter table public.%I add constraint %I foreign key (clinic_id) references public.clinics(id) on delete cascade',
        v_table,v_table||'_clinic_id_fkey'
      );
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

update public.profiles
set platform_role='super_admin'
where role='admin'::public.app_role;

insert into public.clinic_memberships (clinic_id,user_id,role,active)
select c.id,p.id,'clinic_owner'::public.clinic_role,p.active
from public.clinics c
join public.profiles p on p.platform_role='super_admin'::public.platform_role
where c.slug='lunadent-demo'
on conflict (clinic_id,user_id)
do update set role='clinic_owner',active=excluded.active,updated_at=now();

insert into public.clinic_memberships (clinic_id,user_id,role,active)
select
  c.id,p.id,
  case p.role
    when 'admin'::public.app_role then 'clinic_owner'::public.clinic_role
    when 'dentist'::public.app_role then 'dentist'::public.clinic_role
    when 'receptionist'::public.app_role then 'receptionist'::public.clinic_role
    when 'accountant'::public.app_role then 'accountant'::public.clinic_role
  end,
  p.active
from public.profiles p
cross join public.clinics c
where c.slug='lunadent-demo'
  and p.role in ('admin','dentist','receptionist','accountant')
on conflict (clinic_id,user_id) do nothing;

insert into public.clinic_site_settings (
  clinic_id,theme_key,published,site_title,tagline,tokens,sections,content
)
select c.id,'luxury',true,c.name,
  'Modern dental care with a secure digital patient experience.',
  t.default_tokens,
  '[{"key":"hero","enabled":true},{"key":"services","enabled":true},{"key":"doctors","enabled":true},{"key":"journey","enabled":true},{"key":"booking","enabled":true},{"key":"contact","enabled":true}]'::jsonb,
  '{"hero":{"eyebrow":"WELCOME TO LUNADENT","title":"A modern clinic experience, from booking to follow-up.","subtitle":"Online booking, treatment planning, secure patient access and clinic operations in one connected experience.","primaryCta":"Book Consultation","secondaryCta":"Explore Treatments"}}'::jsonb
from public.clinics c
join public.themes t on t.key='luxury'
where c.slug='lunadent-demo'
on conflict (clinic_id) do nothing;

insert into public.subscriptions (clinic_id,plan_id,status,billing_provider)
select c.id,p.id,'active','manual'
from public.clinics c join public.plans p on p.code='enterprise'
where c.slug='lunadent-demo'
on conflict (clinic_id) do nothing;

-- Convert single-tenant uniqueness to tenant-local uniqueness.
alter table public.patients drop constraint if exists patients_auth_user_id_key;
alter table public.patients drop constraint if exists patients_patient_no_key;
alter table public.doctors drop constraint if exists doctors_profile_id_key;
alter table public.inventory_items drop constraint if exists inventory_items_sku_key;
alter table public.rooms drop constraint if exists rooms_name_key;
alter table public.treatments drop constraint if exists treatments_code_key;

create unique index if not exists patients_clinic_auth_user_uidx
  on public.patients(clinic_id,auth_user_id) where auth_user_id is not null;
create unique index if not exists patients_clinic_patient_no_uidx on public.patients(clinic_id,patient_no);
create unique index if not exists doctors_clinic_profile_uidx
  on public.doctors(clinic_id,profile_id) where profile_id is not null;
create unique index if not exists inventory_clinic_sku_uidx on public.inventory_items(clinic_id,sku);
create unique index if not exists rooms_clinic_name_uidx on public.rooms(clinic_id,name);
create unique index if not exists treatments_clinic_code_uidx on public.treatments(clinic_id,code);

-- Canonical composite keys used by tenant-aware foreign keys.
create unique index if not exists patients_clinic_id_id_uidx on public.patients(clinic_id,id);
create unique index if not exists doctors_clinic_id_id_uidx on public.doctors(clinic_id,id);
create unique index if not exists treatments_clinic_id_id_uidx on public.treatments(clinic_id,id);
create unique index if not exists rooms_clinic_id_id_uidx on public.rooms(clinic_id,id);
create unique index if not exists appointments_clinic_id_id_uidx on public.appointments(clinic_id,id);
create unique index if not exists treatment_plans_clinic_id_id_uidx on public.treatment_plans(clinic_id,id);
create unique index if not exists invoices_clinic_id_id_uidx on public.invoices(clinic_id,id);
create unique index if not exists inventory_items_clinic_id_id_uidx on public.inventory_items(clinic_id,id);

do $$
begin
  if not exists(select 1 from pg_constraint where conname='medical_history_clinic_patient_fkey') then
    alter table public.patient_medical_history add constraint medical_history_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='appointments_clinic_patient_fkey') then
    alter table public.appointments add constraint appointments_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='appointments_clinic_doctor_fkey') then
    alter table public.appointments add constraint appointments_clinic_doctor_fkey foreign key (clinic_id,doctor_id) references public.doctors(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='appointments_clinic_treatment_fkey') then
    alter table public.appointments add constraint appointments_clinic_treatment_fkey foreign key (clinic_id,treatment_id) references public.treatments(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='appointments_clinic_room_fkey') then
    alter table public.appointments add constraint appointments_clinic_room_fkey foreign key (clinic_id,room_id) references public.rooms(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='clinical_notes_clinic_patient_fkey') then
    alter table public.clinical_notes add constraint clinical_notes_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='clinical_notes_clinic_doctor_fkey') then
    alter table public.clinical_notes add constraint clinical_notes_clinic_doctor_fkey foreign key (clinic_id,doctor_id) references public.doctors(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='chart_clinic_patient_fkey') then
    alter table public.dental_chart_entries add constraint chart_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='plans_clinic_patient_fkey') then
    alter table public.treatment_plans add constraint plans_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='plan_items_clinic_plan_fkey') then
    alter table public.treatment_plan_items add constraint plan_items_clinic_plan_fkey foreign key (clinic_id,treatment_plan_id) references public.treatment_plans(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='plan_items_clinic_treatment_fkey') then
    alter table public.treatment_plan_items add constraint plan_items_clinic_treatment_fkey foreign key (clinic_id,treatment_id) references public.treatments(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='invoices_clinic_patient_fkey') then
    alter table public.invoices add constraint invoices_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='invoices_clinic_plan_fkey') then
    alter table public.invoices add constraint invoices_clinic_plan_fkey foreign key (clinic_id,treatment_plan_id) references public.treatment_plans(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='invoice_items_clinic_invoice_fkey') then
    alter table public.invoice_items add constraint invoice_items_clinic_invoice_fkey foreign key (clinic_id,invoice_id) references public.invoices(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='payments_clinic_patient_fkey') then
    alter table public.payments add constraint payments_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='payments_clinic_invoice_fkey') then
    alter table public.payments add constraint payments_clinic_invoice_fkey foreign key (clinic_id,invoice_id) references public.invoices(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='inventory_tx_clinic_item_fkey') then
    alter table public.inventory_transactions add constraint inventory_tx_clinic_item_fkey foreign key (clinic_id,inventory_item_id) references public.inventory_items(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='inventory_tx_clinic_appt_fkey') then
    alter table public.inventory_transactions add constraint inventory_tx_clinic_appt_fkey foreign key (clinic_id,appointment_id) references public.appointments(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='documents_clinic_patient_fkey') then
    alter table public.patient_documents add constraint documents_clinic_patient_fkey foreign key (clinic_id,patient_id) references public.patients(clinic_id,id);
  end if;
  if not exists(select 1 from pg_constraint where conname='booking_clinic_treatment_fkey') then
    alter table public.booking_requests add constraint booking_clinic_treatment_fkey foreign key (clinic_id,treatment_id) references public.treatments(clinic_id,id);
  end if;
end $$;

-- Tenant-heavy covering indexes.
create index if not exists clinic_memberships_user_idx on public.clinic_memberships(user_id,active);
create index if not exists appointments_clinic_start_idx on public.appointments(clinic_id,start_at);
create index if not exists appointments_clinic_patient_idx on public.appointments(clinic_id,patient_id);
create index if not exists appointments_clinic_doctor_idx on public.appointments(clinic_id,doctor_id);
create index if not exists booking_requests_clinic_created_idx on public.booking_requests(clinic_id,created_at desc);
create index if not exists clinical_notes_clinic_patient_idx on public.clinical_notes(clinic_id,patient_id);
create index if not exists dental_chart_entries_clinic_patient_idx on public.dental_chart_entries(clinic_id,patient_id);
create index if not exists invoices_clinic_patient_idx on public.invoices(clinic_id,patient_id);
create index if not exists payments_clinic_patient_idx on public.payments(clinic_id,patient_id);
create index if not exists patients_auth_user_idx on public.patients(auth_user_id) where auth_user_id is not null;
create index if not exists clinic_site_settings_theme_idx on public.clinic_site_settings(theme_key);
create index if not exists subscriptions_plan_idx on public.subscriptions(plan_id) where plan_id is not null;

-- Authorization helpers live in the private schema. They are SECURITY DEFINER only
-- to perform protected membership/profile lookups and always bind access to auth.uid().
create or replace function private.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path=''
as $
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.active=true
      and p.platform_role='super_admin'::public.platform_role
  );
$;

create or replace function private.has_clinic_role(
  p_clinic_id uuid,
  p_roles public.clinic_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path=''
as $
  select auth.uid() is not null and exists (
    select 1 from public.clinic_memberships m
    where m.clinic_id=p_clinic_id
      and m.user_id=auth.uid()
      and m.active=true
      and (p_roles is null or m.role=any(p_roles))
  );
$;

revoke all on function private.is_platform_super_admin() from public,anon;
revoke all on function private.has_clinic_role(uuid,public.clinic_role[]) from public,anon;
grant execute on function private.is_platform_super_admin() to authenticated;
grant execute on function private.has_clinic_role(uuid,public.clinic_role[]) to authenticated;

-- One platform owner.
create unique index if not exists profiles_single_platform_super_admin_idx
  on public.profiles(platform_role)
  where platform_role='super_admin'::public.platform_role;

create or replace function private.protect_owner_admin()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='UPDATE' then
    if old.platform_role='super_admin'::public.platform_role
       and (new.platform_role<>'super_admin'::public.platform_role or new.active is distinct from true) then
      raise exception 'The platform Super Admin must remain active and Super Admin';
    end if;
    if old.role='admin'::public.app_role
       and (new.role<>'admin'::public.app_role or new.active is distinct from true) then
      raise exception 'The owner administrator account must remain active and admin';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_owner_admin() from public,anon,authenticated;

drop trigger if exists profiles_protect_owner_admin on public.profiles;
create trigger profiles_protect_owner_admin
before update of role,platform_role,active on public.profiles
for each row execute function private.protect_owner_admin();

create or replace function private.protect_clinic_platform_fields()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin')
     and not private.is_platform_super_admin() then
    if new.status is distinct from old.status then
      raise exception 'Clinic status is managed by the LunaDent platform';
    end if;
    if new.id is distinct from old.id then raise exception 'Clinic identity cannot be changed'; end if;
    if new.created_at is distinct from old.created_at then raise exception 'Clinic creation timestamp cannot be changed'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_clinic_platform_fields() from public,anon,authenticated;

drop trigger if exists clinics_protect_platform_fields on public.clinics;
create trigger clinics_protect_platform_fields
before update on public.clinics
for each row execute function private.protect_clinic_platform_fields();

create or replace function private.protect_site_platform_fields()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin')
     and not private.is_platform_super_admin() then
    if new.clinic_id is distinct from old.clinic_id then raise exception 'Website tenant identity cannot be changed'; end if;
    if new.domain_verified is distinct from old.domain_verified then
      raise exception 'Custom domain verification is managed by the LunaDent platform';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_site_platform_fields() from public,anon,authenticated;

drop trigger if exists clinic_site_settings_protect_platform_fields on public.clinic_site_settings;
create trigger clinic_site_settings_protect_platform_fields
before update on public.clinic_site_settings
for each row execute function private.protect_site_platform_fields();

drop trigger if exists themes_set_updated_at on public.themes;
create trigger themes_set_updated_at before update on public.themes
for each row execute function public.set_updated_at();
drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.set_updated_at();
drop trigger if exists clinics_set_updated_at on public.clinics;
create trigger clinics_set_updated_at before update on public.clinics
for each row execute function public.set_updated_at();
drop trigger if exists memberships_set_updated_at on public.clinic_memberships;
create trigger memberships_set_updated_at before update on public.clinic_memberships
for each row execute function public.set_updated_at();
drop trigger if exists site_settings_set_updated_at on public.clinic_site_settings;
create trigger site_settings_set_updated_at before update on public.clinic_site_settings
for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
drop trigger if exists saas_leads_set_updated_at on public.saas_leads;
create trigger saas_leads_set_updated_at before update on public.saas_leads
for each row execute function public.set_updated_at();
