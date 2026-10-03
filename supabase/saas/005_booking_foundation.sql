-- Professional booking foundation.
-- Adds a tenant-safe doctor reference and prevents confirmed schedule overlaps.

create extension if not exists btree_gist with schema extensions;

alter table public.booking_requests
  add column if not exists doctor_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='booking_requests_doctor_tenant_fkey'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_doctor_tenant_fkey
      foreign key (clinic_id,doctor_id)
      references public.doctors(clinic_id,id)
      on delete set null;
  end if;
end $$;

create index if not exists booking_requests_clinic_doctor_idx
  on public.booking_requests(clinic_id,doctor_id)
  where doctor_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='appointments_no_doctor_overlap'
  ) then
    alter table public.appointments
      add constraint appointments_no_doctor_overlap
      exclude using gist (
        clinic_id with =,
        doctor_id with =,
        tstzrange(start_at,end_at,'[)') with &&
      )
      where (
        doctor_id is not null
        and status not in (
          'cancelled'::public.appointment_status,
          'no_show'::public.appointment_status
        )
      );
  end if;
end $$;
