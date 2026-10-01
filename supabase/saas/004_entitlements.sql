-- LunaDent SaaS commercial entitlements.
-- Enforces subscription state and plan features at the database boundary.

create or replace function private.clinic_subscription_usable(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.clinics c
    join public.subscriptions s on s.clinic_id=c.id
    join public.plans p on p.id=s.plan_id
    where c.id=p_clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
      and s.status in ('trialing'::public.subscription_status,'active'::public.subscription_status)
      and p.active=true
      and (
        s.status<>'trialing'::public.subscription_status
        or s.trial_ends_at is null
        or s.trial_ends_at>now()
      )
      and (s.current_period_end is null or s.current_period_end>now())
  );
$$;

create or replace function private.clinic_feature_enabled(p_clinic_id uuid,p_feature text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select auth.uid() is not null
    and private.clinic_subscription_usable(p_clinic_id)
    and exists (
      select 1
      from public.subscriptions s
      join public.plans p on p.id=s.plan_id
      where s.clinic_id=p_clinic_id
        and coalesce((p.features->>p_feature)::boolean,false)=true
    );
$$;

revoke all on function private.clinic_subscription_usable(uuid) from public,anon;
revoke all on function private.clinic_feature_enabled(uuid,text) from public,anon;
grant execute on function private.clinic_subscription_usable(uuid) to authenticated;
grant execute on function private.clinic_feature_enabled(uuid,text) to authenticated;

-- Core operational writes become read-only when the subscription is not usable.
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and (
    private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
    or (
      auth_user_id=(select auth.uid())
      and created_by=(select auth.uid())
      and exists (
        select 1 from public.clinics c
        where c.id=clinic_id
          and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
      )
    )
  )
);

drop policy if exists patients_staff_update on public.patients;
create policy patients_staff_update on public.patients for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);

drop policy if exists patients_owner_delete on public.patients;
create policy patients_owner_delete on public.patients for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists medical_history_clinical_insert on public.patient_medical_history;
create policy medical_history_clinical_insert on public.patient_medical_history for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists medical_history_clinical_update on public.patient_medical_history;
create policy medical_history_clinical_update on public.patient_medical_history for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);

drop policy if exists doctors_owner_reception_insert on public.doctors;
create policy doctors_owner_reception_insert on public.doctors for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists doctors_owner_reception_update on public.doctors;
create policy doctors_owner_reception_update on public.doctors for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists doctors_owner_reception_delete on public.doctors;
create policy doctors_owner_reception_delete on public.doctors for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

drop policy if exists treatments_owner_reception_insert on public.treatments;
create policy treatments_owner_reception_insert on public.treatments for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists treatments_owner_reception_update on public.treatments;
create policy treatments_owner_reception_update on public.treatments for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists treatments_owner_reception_delete on public.treatments;
create policy treatments_owner_reception_delete on public.treatments for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

drop policy if exists rooms_owner_reception_insert on public.rooms;
create policy rooms_owner_reception_insert on public.rooms for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists rooms_owner_reception_update on public.rooms;
create policy rooms_owner_reception_update on public.rooms for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists rooms_owner_reception_delete on public.rooms;
create policy rooms_owner_reception_delete on public.rooms for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

drop policy if exists appointments_staff_insert on public.appointments;
create policy appointments_staff_insert on public.appointments for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists appointments_staff_update on public.appointments;
create policy appointments_staff_update on public.appointments for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists appointments_owner_reception_delete on public.appointments;
create policy appointments_owner_reception_delete on public.appointments for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

drop policy if exists clinical_notes_clinical_insert on public.clinical_notes;
create policy clinical_notes_clinical_insert on public.clinical_notes for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists clinical_notes_clinical_update on public.clinical_notes;
create policy clinical_notes_clinical_update on public.clinical_notes for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists clinical_notes_owner_delete on public.clinical_notes;
create policy clinical_notes_owner_delete on public.clinical_notes for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists chart_clinical_insert on public.dental_chart_entries;
create policy chart_clinical_insert on public.dental_chart_entries for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists chart_clinical_update on public.dental_chart_entries;
create policy chart_clinical_update on public.dental_chart_entries for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists chart_owner_delete on public.dental_chart_entries;
create policy chart_owner_delete on public.dental_chart_entries for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists plans_clinical_insert on public.treatment_plans;
create policy plans_clinical_insert on public.treatment_plans for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists plans_clinical_update on public.treatment_plans;
create policy plans_clinical_update on public.treatment_plans for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists plans_clinical_delete on public.treatment_plans;
create policy plans_clinical_delete on public.treatment_plans for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);

drop policy if exists plan_items_clinical_insert on public.treatment_plan_items;
create policy plan_items_clinical_insert on public.treatment_plan_items for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists plan_items_clinical_update on public.treatment_plan_items;
create policy plan_items_clinical_update on public.treatment_plan_items for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);
drop policy if exists plan_items_clinical_delete on public.treatment_plan_items;
create policy plan_items_clinical_delete on public.treatment_plan_items for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
);

-- Accounting is a paid feature. Patients can still read their historical financial records.
drop policy if exists invoices_read on public.invoices;
create policy invoices_read on public.invoices for select to authenticated
using (
  (
    private.clinic_feature_enabled(clinic_id,'accounting')
    and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  )
  or exists (
    select 1 from public.patients p
    where p.id=public.invoices.patient_id
      and p.clinic_id=public.invoices.clinic_id
      and p.auth_user_id=(select auth.uid())
  )
);
drop policy if exists invoices_finance_insert on public.invoices;
create policy invoices_finance_insert on public.invoices for insert to authenticated
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists invoices_finance_update on public.invoices;
create policy invoices_finance_update on public.invoices for update to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
)
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists invoices_finance_delete on public.invoices;
create policy invoices_finance_delete on public.invoices for delete to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);

drop policy if exists invoice_items_read on public.invoice_items;
create policy invoice_items_read on public.invoice_items for select to authenticated
using (
  (
    private.clinic_feature_enabled(clinic_id,'accounting')
    and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  )
  or exists (
    select 1
    from public.invoices i
    join public.patients p on p.id=i.patient_id and p.clinic_id=i.clinic_id
    where i.id=public.invoice_items.invoice_id
      and i.clinic_id=public.invoice_items.clinic_id
      and p.auth_user_id=(select auth.uid())
  )
);
drop policy if exists invoice_items_finance_insert on public.invoice_items;
create policy invoice_items_finance_insert on public.invoice_items for insert to authenticated
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists invoice_items_finance_update on public.invoice_items;
create policy invoice_items_finance_update on public.invoice_items for update to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
)
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists invoice_items_finance_delete on public.invoice_items;
create policy invoice_items_finance_delete on public.invoice_items for delete to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select to authenticated
using (
  (
    private.clinic_feature_enabled(clinic_id,'accounting')
    and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  )
  or exists (
    select 1 from public.patients p
    where p.id=public.payments.patient_id
      and p.clinic_id=public.payments.clinic_id
      and p.auth_user_id=(select auth.uid())
  )
);
drop policy if exists payments_finance_insert on public.payments;
create policy payments_finance_insert on public.payments for insert to authenticated
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists payments_finance_update on public.payments;
create policy payments_finance_update on public.payments for update to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
)
with check (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);
drop policy if exists payments_finance_delete on public.payments;
create policy payments_finance_delete on public.payments for delete to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'accounting')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[])
);

-- Inventory is a paid feature.
drop policy if exists inventory_staff_read on public.inventory_items;
create policy inventory_staff_read on public.inventory_items for select to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists inventory_owner_reception_insert on public.inventory_items;
create policy inventory_owner_reception_insert on public.inventory_items for insert to authenticated
with check (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists inventory_owner_reception_update on public.inventory_items;
create policy inventory_owner_reception_update on public.inventory_items for update to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists inventory_owner_reception_delete on public.inventory_items;
create policy inventory_owner_reception_delete on public.inventory_items for delete to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

drop policy if exists inventory_transactions_staff_read on public.inventory_transactions;
create policy inventory_transactions_staff_read on public.inventory_transactions for select to authenticated
using (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists inventory_transactions_staff_insert on public.inventory_transactions;
create policy inventory_transactions_staff_insert on public.inventory_transactions for insert to authenticated
with check (
  private.clinic_feature_enabled(clinic_id,'inventory')
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);

drop policy if exists documents_staff_insert on public.patient_documents;
create policy documents_staff_insert on public.patient_documents for insert to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists documents_staff_update on public.patient_documents;
create policy documents_staff_update on public.patient_documents for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);
drop policy if exists documents_staff_delete on public.patient_documents;
create policy documents_staff_delete on public.patient_documents for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
);

drop policy if exists booking_staff_update on public.booking_requests;
create policy booking_staff_update on public.booking_requests for update to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
)
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);
drop policy if exists booking_owner_delete on public.booking_requests;
create policy booking_owner_delete on public.booking_requests for delete to authenticated
using (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
);

-- RPCs fail closed even if called directly.
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
  if not private.clinic_feature_enabled(v_clinic_id,'accounting') then
    raise exception 'accounting is not available for this clinic plan';
  end if;
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
  if not private.clinic_feature_enabled(v_invoice.clinic_id,'accounting') then
    raise exception 'accounting is not available for this clinic plan';
  end if;
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
  if not private.clinic_feature_enabled(v_clinic_id,'inventory') then
    raise exception 'inventory is not available for this clinic plan';
  end if;
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
