-- LunaDent SaaS tenant isolation policies.
-- Requires supabase/saas/001_core.sql.

alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.themes enable row level security;
alter table public.clinic_site_settings enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saas_leads enable row level security;

grant select on public.clinics,public.themes,public.clinic_site_settings,public.plans to anon,authenticated;
grant select on public.clinic_memberships,public.subscriptions to authenticated;
grant insert,update,delete on public.clinics,public.themes,public.clinic_site_settings,public.plans,public.subscriptions to authenticated;
grant insert on public.saas_leads to anon,authenticated;
grant select,update,delete on public.saas_leads to authenticated;

drop policy if exists clinics_anon_read on public.clinics;
create policy clinics_anon_read on public.clinics for select to anon
using (status in ('trialing'::public.clinic_status,'active'::public.clinic_status));

drop policy if exists clinics_authenticated_read on public.clinics;
create policy clinics_authenticated_read on public.clinics for select to authenticated
using (
  status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  or private.is_platform_super_admin()
  or private.has_clinic_role(id,null)
);

drop policy if exists clinics_superadmin_insert on public.clinics;
create policy clinics_superadmin_insert on public.clinics for insert to authenticated
with check (private.is_platform_super_admin());

drop policy if exists clinics_update on public.clinics;
create policy clinics_update on public.clinics for update to authenticated
using (
  private.is_platform_super_admin()
  or private.has_clinic_role(id,array['clinic_owner']::public.clinic_role[])
)
with check (
  private.is_platform_super_admin()
  or private.has_clinic_role(id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists clinics_superadmin_delete on public.clinics;
create policy clinics_superadmin_delete on public.clinics for delete to authenticated
using (private.is_platform_super_admin());

drop policy if exists memberships_read on public.clinic_memberships;
create policy memberships_read on public.clinic_memberships for select to authenticated
using (
  user_id=(select auth.uid())
  or private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  or private.is_platform_super_admin()
);

drop policy if exists themes_anon_read on public.themes;
create policy themes_anon_read on public.themes for select to anon using (active=true);
drop policy if exists themes_authenticated_read on public.themes;
create policy themes_authenticated_read on public.themes for select to authenticated
using (active=true or private.is_platform_super_admin());
drop policy if exists themes_superadmin_insert on public.themes;
create policy themes_superadmin_insert on public.themes for insert to authenticated
with check (private.is_platform_super_admin());
drop policy if exists themes_superadmin_update on public.themes;
create policy themes_superadmin_update on public.themes for update to authenticated
using (private.is_platform_super_admin()) with check (private.is_platform_super_admin());
drop policy if exists themes_superadmin_delete on public.themes;
create policy themes_superadmin_delete on public.themes for delete to authenticated
using (private.is_platform_super_admin());

drop policy if exists plans_anon_read on public.plans;
create policy plans_anon_read on public.plans for select to anon using (active=true);
drop policy if exists plans_authenticated_read on public.plans;
create policy plans_authenticated_read on public.plans for select to authenticated
using (active=true or private.is_platform_super_admin());
drop policy if exists plans_superadmin_insert on public.plans;
create policy plans_superadmin_insert on public.plans for insert to authenticated
with check (private.is_platform_super_admin());
drop policy if exists plans_superadmin_update on public.plans;
create policy plans_superadmin_update on public.plans for update to authenticated
using (private.is_platform_super_admin()) with check (private.is_platform_super_admin());
drop policy if exists plans_superadmin_delete on public.plans;
create policy plans_superadmin_delete on public.plans for delete to authenticated
using (private.is_platform_super_admin());

drop policy if exists site_settings_anon_read on public.clinic_site_settings;
create policy site_settings_anon_read on public.clinic_site_settings for select to anon
using (
  published=true
  and exists (
    select 1 from public.clinics c
    where c.id=clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  )
);

drop policy if exists site_settings_authenticated_read on public.clinic_site_settings;
create policy site_settings_authenticated_read on public.clinic_site_settings for select to authenticated
using (
  (
    published=true
    and exists (
      select 1 from public.clinics c
      where c.id=clinic_id
        and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
    )
  )
  or private.has_clinic_role(clinic_id,null)
  or private.is_platform_super_admin()
);

drop policy if exists site_settings_owner_insert on public.clinic_site_settings;
create policy site_settings_owner_insert on public.clinic_site_settings for insert to authenticated
with check (
  private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  or private.is_platform_super_admin()
);
drop policy if exists site_settings_owner_update on public.clinic_site_settings;
create policy site_settings_owner_update on public.clinic_site_settings for update to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  or private.is_platform_super_admin()
)
with check (
  private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  or private.is_platform_super_admin()
);

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select to authenticated
using (
  private.is_platform_super_admin()
  or private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
);
drop policy if exists subscriptions_superadmin_insert on public.subscriptions;
create policy subscriptions_superadmin_insert on public.subscriptions for insert to authenticated
with check (private.is_platform_super_admin());
drop policy if exists subscriptions_superadmin_update on public.subscriptions;
create policy subscriptions_superadmin_update on public.subscriptions for update to authenticated
using (private.is_platform_super_admin()) with check (private.is_platform_super_admin());
drop policy if exists subscriptions_superadmin_delete on public.subscriptions;
create policy subscriptions_superadmin_delete on public.subscriptions for delete to authenticated
using (private.is_platform_super_admin());

drop policy if exists saas_leads_public_insert on public.saas_leads;
create policy saas_leads_public_insert on public.saas_leads for insert to anon,authenticated
with check (nullif(trim(full_name),'') is not null and nullif(trim(email),'') is not null);
drop policy if exists saas_leads_superadmin_read on public.saas_leads;
create policy saas_leads_superadmin_read on public.saas_leads for select to authenticated
using (private.is_platform_super_admin());
drop policy if exists saas_leads_superadmin_update on public.saas_leads;
create policy saas_leads_superadmin_update on public.saas_leads for update to authenticated
using (private.is_platform_super_admin()) with check (private.is_platform_super_admin());
drop policy if exists saas_leads_superadmin_delete on public.saas_leads;
create policy saas_leads_superadmin_delete on public.saas_leads for delete to authenticated
using (private.is_platform_super_admin());

-- Remove the original single-clinic policies before installing tenant-scoped policies.
do $$
declare r record;
begin
  for r in
    select tablename,policyname
    from pg_policies
    where schemaname='public'
      and tablename in (
        'patients','patient_medical_history','doctors','treatments','rooms',
        'appointments','clinical_notes','dental_chart_entries','treatment_plans',
        'treatment_plan_items','invoices','invoice_items','payments','inventory_items',
        'inventory_transactions','patient_documents','booking_requests'
      )
  loop
    execute format('drop policy if exists %I on public.%I',r.policyname,r.tablename);
  end loop;
end $$;

revoke all on public.patients,public.patient_medical_history,public.doctors,public.treatments,public.rooms,
  public.appointments,public.clinical_notes,public.dental_chart_entries,public.treatment_plans,
  public.treatment_plan_items,public.invoices,public.invoice_items,public.payments,public.inventory_items,
  public.inventory_transactions,public.patient_documents,public.booking_requests from anon;

grant select on public.doctors,public.treatments to anon;
grant insert on public.booking_requests to anon;
grant select,insert,update,delete on public.patients,public.patient_medical_history,public.doctors,public.treatments,public.rooms,
  public.appointments,public.clinical_notes,public.dental_chart_entries,public.treatment_plans,
  public.treatment_plan_items,public.invoices,public.invoice_items,public.payments,public.inventory_items,
  public.inventory_transactions,public.patient_documents,public.booking_requests to authenticated;

-- Patients: staff within the same clinic or the patient who owns the record.
create policy patients_read on public.patients for select to authenticated
using (
  auth_user_id=(select auth.uid())
  or private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
);

create policy patients_insert on public.patients for insert to authenticated
with check (
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
);

create policy patients_staff_update on public.patients for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));

create policy patients_owner_delete on public.patients for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[]));

create policy medical_history_read on public.patient_medical_history for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[])
  or exists (
    select 1 from public.patients p
    where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
  )
);
create policy medical_history_clinical_insert on public.patient_medical_history for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy medical_history_clinical_update on public.patient_medical_history for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));

create policy doctors_anon_read on public.doctors for select to anon
using (
  active=true and exists (
    select 1 from public.clinics c
    where c.id=clinic_id and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  )
);
create policy doctors_authenticated_read on public.doctors for select to authenticated
using (
  (
    active=true and exists (
      select 1 from public.clinics c
      where c.id=clinic_id and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
    )
  )
  or private.has_clinic_role(clinic_id,null)
);
create policy doctors_owner_reception_insert on public.doctors for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy doctors_owner_reception_update on public.doctors for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy doctors_owner_reception_delete on public.doctors for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));

create policy treatments_anon_read on public.treatments for select to anon
using (
  active=true and exists (
    select 1 from public.clinics c
    where c.id=clinic_id and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  )
);
create policy treatments_authenticated_read on public.treatments for select to authenticated
using (
  (
    active=true and exists (
      select 1 from public.clinics c
      where c.id=clinic_id and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
    )
  )
  or private.has_clinic_role(clinic_id,null)
);
create policy treatments_owner_reception_insert on public.treatments for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy treatments_owner_reception_update on public.treatments for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy treatments_owner_reception_delete on public.treatments for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));

create policy rooms_staff_read on public.rooms for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy rooms_owner_reception_insert on public.rooms for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy rooms_owner_reception_update on public.rooms for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy rooms_owner_reception_delete on public.rooms for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));

create policy appointments_read on public.appointments for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or exists (
    select 1 from public.patients p
    where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
  )
);
create policy appointments_staff_insert on public.appointments for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy appointments_staff_update on public.appointments for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy appointments_owner_reception_delete on public.appointments for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));

create policy clinical_notes_clinical_read on public.clinical_notes for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy clinical_notes_clinical_insert on public.clinical_notes for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy clinical_notes_clinical_update on public.clinical_notes for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy clinical_notes_owner_delete on public.clinical_notes for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[]));

create policy chart_clinical_read on public.dental_chart_entries for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy chart_clinical_insert on public.dental_chart_entries for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy chart_clinical_update on public.dental_chart_entries for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy chart_owner_delete on public.dental_chart_entries for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[]));

create policy treatment_plans_read on public.treatment_plans for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or (
    status<>'draft'::public.plan_status
    and exists (
      select 1 from public.patients p
      where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
    )
  )
);
create policy plans_clinical_insert on public.treatment_plans for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy plans_clinical_update on public.treatment_plans for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy plans_clinical_delete on public.treatment_plans for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));

create policy plan_items_read on public.treatment_plan_items for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or exists (
    select 1
    from public.treatment_plans tp
    join public.patients p on p.id=tp.patient_id and p.clinic_id=tp.clinic_id
    where tp.id=treatment_plan_id
      and tp.clinic_id=clinic_id
      and tp.status<>'draft'::public.plan_status
      and p.auth_user_id=(select auth.uid())
  )
);
create policy plan_items_clinical_insert on public.treatment_plan_items for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy plan_items_clinical_update on public.treatment_plan_items for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));
create policy plan_items_clinical_delete on public.treatment_plan_items for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist']::public.clinic_role[]));

create policy invoices_read on public.invoices for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or exists (
    select 1 from public.patients p
    where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
  )
);
create policy invoices_finance_insert on public.invoices for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy invoices_finance_update on public.invoices for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy invoices_finance_delete on public.invoices for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));

create policy invoice_items_read on public.invoice_items for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or exists (
    select 1 from public.invoices i
    join public.patients p on p.id=i.patient_id and p.clinic_id=i.clinic_id
    where i.id=invoice_id and i.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
  )
);
create policy invoice_items_finance_insert on public.invoice_items for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy invoice_items_finance_update on public.invoice_items for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy invoice_items_finance_delete on public.invoice_items for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));

create policy payments_read on public.payments for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist','accountant']::public.clinic_role[])
  or exists (
    select 1 from public.patients p
    where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
  )
);
create policy payments_finance_insert on public.payments for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy payments_finance_update on public.payments for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));
create policy payments_finance_delete on public.payments for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist','accountant']::public.clinic_role[]));

create policy inventory_staff_read on public.inventory_items for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy inventory_owner_reception_insert on public.inventory_items for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy inventory_owner_reception_update on public.inventory_items for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy inventory_owner_reception_delete on public.inventory_items for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));

create policy inventory_transactions_staff_read on public.inventory_transactions for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy inventory_transactions_staff_insert on public.inventory_transactions for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));

create policy documents_read on public.patient_documents for select to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[])
  or (
    patient_visible=true
    and exists (
      select 1 from public.patients p
      where p.id=patient_id and p.clinic_id=clinic_id and p.auth_user_id=(select auth.uid())
    )
  )
);
create policy documents_staff_insert on public.patient_documents for insert to authenticated
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy documents_staff_update on public.patient_documents for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));
create policy documents_staff_delete on public.patient_documents for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','dentist','receptionist']::public.clinic_role[]));

create policy booking_public_insert on public.booking_requests for insert to anon,authenticated
with check (
  exists (
    select 1 from public.clinics c
    where c.id=clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
  )
);
create policy booking_staff_read on public.booking_requests for select to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy booking_staff_update on public.booking_requests for update to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]))
with check (private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[]));
create policy booking_owner_delete on public.booking_requests for delete to authenticated
using (private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[]));
