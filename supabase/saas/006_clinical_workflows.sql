-- LunaDent professional clinical workflows.
-- Adds treatment-plan lifecycle/totals, secure patient-file mutations,
-- and atomic booking-request conversion into patient + appointment records.

-- Public booking must go through the validated/rate-limited Edge Function.
drop policy if exists booking_public_insert on public.booking_requests;
revoke insert on public.booking_requests from anon;
revoke insert on public.booking_requests from authenticated;

-- Keep staff document metadata deletion aligned with Storage deletion privileges.
drop policy if exists documents_staff_delete on public.patient_documents;
create policy documents_staff_delete on public.patient_documents for delete to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'patients')
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);

-- Storage writes require a usable subscription and the patient-record feature.
drop policy if exists patient_files_staff_insert on storage.objects;
create policy patient_files_staff_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='patient-files'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role in ('clinic_owner'::public.clinic_role,'dentist'::public.clinic_role,'receptionist'::public.clinic_role)
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
      and private.clinic_feature_enabled(m.clinic_id,'patients')
  )
);

drop policy if exists patient_files_staff_update on storage.objects;
create policy patient_files_staff_update
on storage.objects for update to authenticated
using (
  bucket_id='patient-files'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role in ('clinic_owner'::public.clinic_role,'dentist'::public.clinic_role,'receptionist'::public.clinic_role)
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
      and private.clinic_feature_enabled(m.clinic_id,'patients')
  )
)
with check (
  bucket_id='patient-files'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role in ('clinic_owner'::public.clinic_role,'dentist'::public.clinic_role,'receptionist'::public.clinic_role)
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
      and private.clinic_feature_enabled(m.clinic_id,'patients')
  )
);

drop policy if exists patient_files_staff_delete on storage.objects;
create policy patient_files_staff_delete
on storage.objects for delete to authenticated
using (
  bucket_id='patient-files'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role in ('clinic_owner'::public.clinic_role,'dentist'::public.clinic_role)
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
      and private.clinic_feature_enabled(m.clinic_id,'patients')
  )
);

-- Treatment-plan amounts are derived from their line items.
create or replace function private.recalculate_treatment_plan_totals()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_plan_id uuid;
begin
  v_plan_id:=coalesce(new.treatment_plan_id,old.treatment_plan_id);

  update public.treatment_plans p
  set
    estimated_total=coalesce((
      select sum(greatest((i.quantity*i.unit_price)-i.discount,0))
      from public.treatment_plan_items i
      where i.treatment_plan_id=v_plan_id
        and i.status<>'cancelled'::public.plan_item_status
    ),0),
    discount_total=coalesce((
      select sum(i.discount)
      from public.treatment_plan_items i
      where i.treatment_plan_id=v_plan_id
        and i.status<>'cancelled'::public.plan_item_status
    ),0)
  where p.id=v_plan_id;

  if tg_op='UPDATE' and old.treatment_plan_id is distinct from new.treatment_plan_id then
    update public.treatment_plans p
    set
      estimated_total=coalesce((
        select sum(greatest((i.quantity*i.unit_price)-i.discount,0))
        from public.treatment_plan_items i
        where i.treatment_plan_id=old.treatment_plan_id
          and i.status<>'cancelled'::public.plan_item_status
      ),0),
      discount_total=coalesce((
        select sum(i.discount)
        from public.treatment_plan_items i
        where i.treatment_plan_id=old.treatment_plan_id
          and i.status<>'cancelled'::public.plan_item_status
      ),0)
    where p.id=old.treatment_plan_id;
  end if;

  return coalesce(new,old);
end;
$$;

drop trigger if exists treatment_plan_items_recalculate_totals on public.treatment_plan_items;
create trigger treatment_plan_items_recalculate_totals
after insert or update or delete on public.treatment_plan_items
for each row execute function private.recalculate_treatment_plan_totals();

create or replace function public.set_treatment_plan_status(
  p_treatment_plan_id uuid,
  p_status public.plan_status
)
returns boolean
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_plan public.treatment_plans%rowtype;
begin
  select * into v_plan
  from public.treatment_plans
  where id=p_treatment_plan_id
  for update;

  if not found then raise exception 'treatment plan not found'; end if;

  if not private.clinic_feature_enabled(v_plan.clinic_id,'patients')
     or not private.has_clinic_role(
       v_plan.clinic_id,
       array['clinic_owner','dentist']::public.clinic_role[]
     ) then
    raise exception 'not authorized to update treatment plan';
  end if;

  if p_status=v_plan.status then return true; end if;

  if not (
    (v_plan.status='draft'::public.plan_status and p_status in ('proposed'::public.plan_status,'cancelled'::public.plan_status))
    or (v_plan.status='proposed'::public.plan_status and p_status in ('draft'::public.plan_status,'approved'::public.plan_status,'cancelled'::public.plan_status))
    or (v_plan.status='approved'::public.plan_status and p_status in ('in_progress'::public.plan_status,'cancelled'::public.plan_status))
    or (v_plan.status='in_progress'::public.plan_status and p_status in ('completed'::public.plan_status,'cancelled'::public.plan_status))
  ) then
    raise exception 'invalid treatment plan status transition from % to %',v_plan.status,p_status;
  end if;

  update public.treatment_plans
  set
    status=p_status,
    approved_at=case
      when p_status='approved'::public.plan_status then coalesce(approved_at,now())
      else approved_at
    end
  where id=v_plan.id;

  return true;
end;
$$;

revoke all on function public.set_treatment_plan_status(uuid,public.plan_status) from public,anon;
grant execute on function public.set_treatment_plan_status(uuid,public.plan_status) to authenticated;

create or replace function public.convert_booking_request(
  p_booking_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_request public.booking_requests%rowtype;
  v_timezone text;
  v_patient_id uuid;
  v_patient_matches integer;
  v_first_name text;
  v_last_name text;
  v_duration integer:=30;
  v_start_at timestamptz;
  v_appointment_id uuid;
begin
  select * into v_request
  from public.booking_requests
  where id=p_booking_request_id
  for update;

  if not found then raise exception 'booking request not found'; end if;
  if v_request.status='converted'::public.booking_request_status then
    raise exception 'booking request is already converted';
  end if;
  if v_request.status='closed'::public.booking_request_status then
    raise exception 'closed booking request cannot be converted';
  end if;

  if not private.clinic_feature_enabled(v_request.clinic_id,'appointments')
     or not private.has_clinic_role(
       v_request.clinic_id,
       array['clinic_owner','receptionist']::public.clinic_role[]
     ) then
    raise exception 'not authorized to convert booking request';
  end if;

  if v_request.preferred_date is null or nullif(trim(v_request.preferred_time),'') is null then
    raise exception 'booking request does not have a preferred date and time';
  end if;

  select c.timezone into v_timezone
  from public.clinics c
  where c.id=v_request.clinic_id;

  if v_timezone is null then raise exception 'clinic timezone is not configured'; end if;

  select count(*),min(p.id)
  into v_patient_matches,v_patient_id
  from public.patients p
  where p.clinic_id=v_request.clinic_id
    and p.status<>'archived'::public.patient_status
    and (
      (nullif(trim(v_request.phone),'') is not null and p.phone=v_request.phone)
      or (
        nullif(lower(trim(coalesce(v_request.email,''))),'') is not null
        and lower(coalesce(p.email,''))=lower(v_request.email)
      )
    );

  if v_patient_matches>1 then
    raise exception 'multiple patient records match this booking request; select the patient manually';
  end if;

  if v_patient_id is null then
    v_first_name:=split_part(trim(v_request.full_name),' ',1);
    v_last_name:=trim(substr(trim(v_request.full_name),length(v_first_name)+1));

    insert into public.patients (
      clinic_id,first_name,last_name,phone,email,status,created_by
    )
    values (
      v_request.clinic_id,
      nullif(v_first_name,''),
      coalesce(v_last_name,''),
      nullif(trim(v_request.phone),''),
      nullif(lower(trim(coalesce(v_request.email,''))),''),
      'active'::public.patient_status,
      auth.uid()
    )
    returning id into v_patient_id;
  end if;

  if v_request.treatment_id is not null then
    select greatest(t.duration_minutes,10)
    into v_duration
    from public.treatments t
    where t.id=v_request.treatment_id
      and t.clinic_id=v_request.clinic_id
      and t.active=true;

    if v_duration is null then raise exception 'requested treatment is no longer available'; end if;
  end if;

  begin
    v_start_at:=(
      (v_request.preferred_date + v_request.preferred_time::time)
      at time zone v_timezone
    );
  exception when others then
    raise exception 'booking request time is invalid';
  end;

  if v_start_at<=now() then raise exception 'booking request time is in the past'; end if;

  insert into public.appointments (
    clinic_id,patient_id,doctor_id,treatment_id,start_at,end_at,status,notes,created_by
  )
  values (
    v_request.clinic_id,
    v_patient_id,
    v_request.doctor_id,
    v_request.treatment_id,
    v_start_at,
    v_start_at+make_interval(mins=>v_duration),
    'scheduled'::public.appointment_status,
    nullif(trim(coalesce(v_request.notes,'')),''),
    auth.uid()
  )
  returning id into v_appointment_id;

  update public.booking_requests
  set status='converted'::public.booking_request_status
  where id=v_request.id;

  return jsonb_build_object(
    'patient_id',v_patient_id,
    'appointment_id',v_appointment_id
  );
end;
$$;

revoke all on function public.convert_booking_request(uuid) from public,anon;
grant execute on function public.convert_booking_request(uuid) to authenticated;
