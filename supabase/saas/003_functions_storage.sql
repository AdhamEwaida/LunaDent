-- LunaDent SaaS tenant-aware RPCs and Storage policies.
-- Requires supabase/saas/001_core.sql and 002_rls.sql.

drop function if exists public.create_my_patient_profile(text,text,text,text,date,text,text);

create or replace function public.create_my_patient_profile(
  p_clinic_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_email text default null,
  p_date_of_birth date default null,
  p_sex text default null,
  p_address text default null
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_patient_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  if not exists (
    select 1 from public.clinics c
    where c.id=p_clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  ) then
    raise exception 'Clinic is not available';
  end if;

  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null then
    raise exception 'First and last name are required';
  end if;

  select p.id into v_patient_id
  from public.patients p
  where p.clinic_id=p_clinic_id and p.auth_user_id=v_user_id;

  if v_patient_id is not null then return v_patient_id; end if;

  insert into public.patients (
    clinic_id,auth_user_id,first_name,last_name,phone,email,date_of_birth,sex,address,status,created_by
  )
  values (
    p_clinic_id,v_user_id,trim(p_first_name),trim(p_last_name),
    nullif(trim(p_phone),''),
    nullif(lower(trim(p_email)),''),
    p_date_of_birth,
    case when p_sex in ('male','female','other') then p_sex else null end,
    nullif(trim(p_address),''),
    'active'::public.patient_status,
    v_user_id
  )
  returning id into v_patient_id;

  return v_patient_id;
end;
$$;
revoke all on function public.create_my_patient_profile(uuid,text,text,text,text,date,text,text) from public,anon;
grant execute on function public.create_my_patient_profile(uuid,text,text,text,text,date,text,text) to authenticated;

create or replace function public.search_patients(
  p_clinic_id uuid,
  p_query text default null
)
returns setof public.patients
language sql
stable
security invoker
set search_path=''
as $$
  select p.*
  from public.patients p
  where p.clinic_id=p_clinic_id
    and p.status<>'archived'::public.patient_status
    and (
      nullif(trim(p_query),'') is null
      or p.first_name ilike '%'||trim(p_query)||'%'
      or p.last_name ilike '%'||trim(p_query)||'%'
      or p.patient_no ilike '%'||trim(p_query)||'%'
      or coalesce(p.phone,'') ilike '%'||trim(p_query)||'%'
      or coalesce(p.email,'') ilike '%'||trim(p_query)||'%'
    )
  order by p.created_at desc;
$$;
revoke all on function public.search_patients(uuid,text) from public,anon;
grant execute on function public.search_patients(uuid,text) to authenticated;

create or replace function public.create_simple_invoice(
  p_patient_id uuid,
  p_description text,
  p_amount numeric,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_invoice_id uuid;
  v_clinic_id uuid;
begin
  if p_amount<=0 then raise exception 'amount must be positive'; end if;

  select p.clinic_id into v_clinic_id
  from public.patients p
  where p.id=p_patient_id;

  if v_clinic_id is null then raise exception 'patient not found'; end if;

  if not private.has_clinic_role(
    v_clinic_id,
    array['clinic_owner','receptionist','accountant']::public.clinic_role[]
  ) then
    raise exception 'not authorized to create invoices';
  end if;

  insert into public.invoices (
    clinic_id,patient_id,status,subtotal,total,issued_at,due_at,created_by
  )
  values (
    v_clinic_id,p_patient_id,'issued',p_amount,p_amount,now(),p_due_at,(select auth.uid())
  )
  returning id into v_invoice_id;

  insert into public.invoice_items (
    clinic_id,invoice_id,description,quantity,unit_price,line_total
  )
  values (v_clinic_id,v_invoice_id,p_description,1,p_amount,p_amount);

  return v_invoice_id;
end;
$$;
revoke all on function public.create_simple_invoice(uuid,text,numeric,timestamptz) from public,anon;
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
set search_path=''
as $$
declare
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_new_paid numeric;
begin
  if p_amount<=0 then raise exception 'amount must be positive'; end if;
  if p_method not in ('cash','card','bank_transfer','other') then raise exception 'invalid payment method'; end if;

  select * into v_invoice
  from public.invoices
  where id=p_invoice_id
  for update;

  if not found then raise exception 'invoice not found'; end if;

  if not private.has_clinic_role(
    v_invoice.clinic_id,
    array['clinic_owner','receptionist','accountant']::public.clinic_role[]
  ) then
    raise exception 'not authorized to record payments';
  end if;

  if v_invoice.status='void' then raise exception 'cannot pay a void invoice'; end if;
  if p_amount>v_invoice.balance_due then raise exception 'payment exceeds outstanding balance'; end if;

  insert into public.payments (
    clinic_id,patient_id,invoice_id,amount,method,reference,received_by
  )
  values (
    v_invoice.clinic_id,v_invoice.patient_id,v_invoice.id,p_amount,p_method,p_reference,(select auth.uid())
  )
  returning id into v_payment_id;

  v_new_paid:=v_invoice.paid_total+p_amount;

  update public.invoices
  set paid_total=v_new_paid,
      status=case
        when v_new_paid>=total then 'paid'::public.invoice_status
        else 'partially_paid'::public.invoice_status
      end
  where id=v_invoice.id;

  return v_payment_id;
end;
$$;
revoke all on function public.record_invoice_payment(uuid,numeric,text,text) from public,anon;
grant execute on function public.record_invoice_payment(uuid,numeric,text,text) to authenticated;

create or replace function public.record_inventory_transaction(
  p_inventory_item_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_appointment_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_current numeric;
  v_next numeric;
  v_id uuid;
  v_clinic_id uuid;
begin
  if p_quantity<=0 then raise exception 'quantity must be positive'; end if;
  if p_transaction_type not in ('receive','consume','adjust','waste') then raise exception 'invalid transaction type'; end if;

  select clinic_id,quantity into v_clinic_id,v_current
  from public.inventory_items
  where id=p_inventory_item_id
  for update;

  if not found then raise exception 'inventory item not found'; end if;

  if not private.has_clinic_role(
    v_clinic_id,
    array['clinic_owner','dentist','receptionist']::public.clinic_role[]
  ) then
    raise exception 'not authorized to change inventory';
  end if;

  if p_appointment_id is not null and not exists (
    select 1 from public.appointments a
    where a.id=p_appointment_id and a.clinic_id=v_clinic_id
  ) then
    raise exception 'appointment does not belong to clinic';
  end if;

  v_next:=case
    when p_transaction_type='receive' then v_current+p_quantity
    when p_transaction_type in ('consume','waste') then v_current-p_quantity
    else p_quantity
  end;

  if v_next<0 then raise exception 'insufficient stock'; end if;

  update public.inventory_items set quantity=v_next where id=p_inventory_item_id;

  insert into public.inventory_transactions (
    clinic_id,inventory_item_id,transaction_type,quantity,appointment_id,created_by
  )
  values (
    v_clinic_id,p_inventory_item_id,p_transaction_type,p_quantity,p_appointment_id,auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_status public.appointment_status
)
returns boolean
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_clinic_id uuid;
begin
  select a.clinic_id into v_clinic_id
  from public.appointments a
  where a.id=p_appointment_id;

  if v_clinic_id is null then raise exception 'appointment not found'; end if;

  if not private.has_clinic_role(
    v_clinic_id,
    array['clinic_owner','dentist','receptionist']::public.clinic_role[]
  ) then
    raise exception 'not authorized to update appointments';
  end if;

  update public.appointments set status=p_status where id=p_appointment_id;
  return true;
end;
$$;

-- Patient document metadata and object paths must agree on tenant + patient.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='patient_documents_storage_path_tenant_check'
  ) then
    alter table public.patient_documents
      add constraint patient_documents_storage_path_tenant_check
      check (storage_path like clinic_id::text||'/'||patient_id::text||'/%');
  end if;
end $$;

insert into storage.buckets (id,name,public)
values ('patient-files','patient-files',false)
on conflict (id) do update set public=false;

insert into storage.buckets (id,name,public,file_size_limit)
values ('clinic-assets','clinic-assets',true,10485760)
on conflict (id) do update set public=true,file_size_limit=10485760;

drop policy if exists patient_files_patient_read on storage.objects;
drop policy if exists patient_files_staff_read on storage.objects;
drop policy if exists patient_files_staff_insert on storage.objects;
drop policy if exists patient_files_staff_update on storage.objects;
drop policy if exists patient_files_staff_delete on storage.objects;

create policy patient_files_patient_read
on storage.objects for select to authenticated
using (
  bucket_id='patient-files'
  and exists (
    select 1
    from public.patient_documents d
    join public.patients p on p.id=d.patient_id and p.clinic_id=d.clinic_id
    where d.storage_path=storage.objects.name
      and d.patient_visible=true
      and p.auth_user_id=(select auth.uid())
  )
);

create policy patient_files_staff_read
on storage.objects for select to authenticated
using (
  bucket_id='patient-files'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role in ('clinic_owner'::public.clinic_role,'dentist'::public.clinic_role,'receptionist'::public.clinic_role)
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
  )
);

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
  )
);

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
  )
);

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
  )
);

drop policy if exists clinic_assets_public_read on storage.objects;
drop policy if exists clinic_assets_owner_insert on storage.objects;
drop policy if exists clinic_assets_owner_update on storage.objects;
drop policy if exists clinic_assets_owner_delete on storage.objects;

create policy clinic_assets_public_read
on storage.objects for select to anon,authenticated
using (bucket_id='clinic-assets');

create policy clinic_assets_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='clinic-assets'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role='clinic_owner'::public.clinic_role
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
  )
);

create policy clinic_assets_owner_update
on storage.objects for update to authenticated
using (
  bucket_id='clinic-assets'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role='clinic_owner'::public.clinic_role
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
  )
)
with check (
  bucket_id='clinic-assets'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role='clinic_owner'::public.clinic_role
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
  )
);

create policy clinic_assets_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id='clinic-assets'
  and exists (
    select 1 from public.clinic_memberships m
    where m.user_id=(select auth.uid())
      and m.active=true
      and m.role='clinic_owner'::public.clinic_role
      and m.clinic_id::text=(storage.foldername(storage.objects.name))[1]
  )
);
