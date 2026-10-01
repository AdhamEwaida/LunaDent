-- Professional booking hardening.
-- Public guests must submit through the public-booking Edge Function, never directly through PostgREST.

alter table public.booking_requests
  alter column preferred_time type time without time zone
  using nullif(preferred_time, '')::time;

alter table public.booking_requests
  add column if not exists duration_minutes integer not null default 30;

alter table public.booking_requests
  drop constraint if exists booking_requests_duration_minutes_check;

alter table public.booking_requests
  add constraint booking_requests_duration_minutes_check
  check (duration_minutes between 10 and 480);

drop policy if exists booking_public_insert on public.booking_requests;
revoke insert on public.booking_requests from anon;

drop policy if exists booking_staff_insert on public.booking_requests;
create policy booking_staff_insert
on public.booking_requests for insert
to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(
    clinic_id,
    array['clinic_owner','receptionist']::public.clinic_role[]
  )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.booking_requests'::regclass
      and conname='booking_requests_no_active_doctor_overlap'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_no_active_doctor_overlap
      exclude using gist (
        clinic_id with =,
        doctor_id with =,
        tsrange(
          preferred_date::timestamp + preferred_time,
          preferred_date::timestamp + preferred_time + make_interval(mins => duration_minutes),
          '[)'
        ) with &&
      )
      where (
        doctor_id is not null
        and preferred_date is not null
        and preferred_time is not null
        and status in (
          'new'::public.booking_request_status,
          'contacted'::public.booking_request_status
        )
      );
  end if;
end $$;

create table if not exists public.booking_abuse_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  fingerprint text not null,
  created_at timestamptz not null default now()
);

alter table public.booking_abuse_events enable row level security;
revoke all on public.booking_abuse_events from anon,authenticated;
grant select,insert,delete on public.booking_abuse_events to service_role;

create index if not exists booking_abuse_events_lookup_idx
  on public.booking_abuse_events(clinic_id,fingerprint,created_at desc);

create index if not exists booking_requests_active_slot_idx
  on public.booking_requests(clinic_id,doctor_id,preferred_date,preferred_time)
  where status in ('new'::public.booking_request_status,'contacted'::public.booking_request_status);
