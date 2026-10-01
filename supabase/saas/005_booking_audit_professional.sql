-- Professional booking, website entitlements, and tenant audit trail.

create table if not exists public.clinic_business_hours (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  enabled boolean not null default false,
  open_time time,
  close_time time,
  slot_minutes integer not null default 30 check (slot_minutes in (15,20,30,45,60)),
  updated_at timestamptz not null default now(),
  primary key (clinic_id,weekday),
  check (
    (enabled=false)
    or (open_time is not null and close_time is not null and open_time<close_time)
  )
);

alter table public.clinic_business_hours enable row level security;

grant select on public.clinic_business_hours to anon,authenticated;
grant insert,update,delete on public.clinic_business_hours to authenticated;

drop policy if exists clinic_hours_public_read on public.clinic_business_hours;
drop policy if exists clinic_hours_authenticated_read on public.clinic_business_hours;

create policy clinic_hours_public_read
on public.clinic_business_hours for select
to anon
using (
  exists (
    select 1
    from public.clinics c
    join public.clinic_site_settings s on s.clinic_id=c.id
    where c.id=clinic_business_hours.clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
      and s.published=true
  )
);

create policy clinic_hours_authenticated_read
on public.clinic_business_hours for select
to authenticated
using (
  exists (
    select 1
    from public.clinics c
    join public.clinic_site_settings s on s.clinic_id=c.id
    where c.id=clinic_business_hours.clinic_id
      and c.status in ('trialing'::public.clinic_status,'active'::public.clinic_status)
      and s.published=true
  )
  or private.has_clinic_role(clinic_business_hours.clinic_id,null)
  or private.is_platform_super_admin()
);

drop policy if exists clinic_hours_owner_insert on public.clinic_business_hours;
create policy clinic_hours_owner_insert
on public.clinic_business_hours for insert
to authenticated
with check (
  private.clinic_feature_enabled(clinic_business_hours.clinic_id,'website')
  and private.has_clinic_role(clinic_business_hours.clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists clinic_hours_owner_update on public.clinic_business_hours;
create policy clinic_hours_owner_update
on public.clinic_business_hours for update
to authenticated
using (
  private.clinic_feature_enabled(clinic_business_hours.clinic_id,'website')
  and private.has_clinic_role(clinic_business_hours.clinic_id,array['clinic_owner']::public.clinic_role[])
)
with check (
  private.clinic_feature_enabled(clinic_business_hours.clinic_id,'website')
  and private.has_clinic_role(clinic_business_hours.clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop policy if exists clinic_hours_owner_delete on public.clinic_business_hours;
create policy clinic_hours_owner_delete
on public.clinic_business_hours for delete
to authenticated
using (
  private.clinic_feature_enabled(clinic_business_hours.clinic_id,'website')
  and private.has_clinic_role(clinic_business_hours.clinic_id,array['clinic_owner']::public.clinic_role[])
);

drop trigger if exists clinic_business_hours_set_updated_at on public.clinic_business_hours;
create trigger clinic_business_hours_set_updated_at
before update on public.clinic_business_hours
for each row execute function public.set_updated_at();

insert into public.clinic_business_hours (clinic_id,weekday,enabled,open_time,close_time,slot_minutes)
select
  c.id,
  d.weekday,
  case when d.weekday between 1 and 5 then true when d.weekday=6 then true else false end,
  case when d.weekday between 1 and 5 then '09:00'::time when d.weekday=6 then '10:00'::time else null end,
  case when d.weekday between 1 and 5 then '17:00'::time when d.weekday=6 then '14:00'::time else null end,
  30
from public.clinics c
cross join generate_series(0,6) as d(weekday)
on conflict (clinic_id,weekday) do nothing;

-- Public visitors submit bookings only through the validated Edge Function.
drop policy if exists booking_public_insert on public.booking_requests;
revoke insert on public.booking_requests from anon;

drop policy if exists booking_staff_insert on public.booking_requests;
create policy booking_staff_insert
on public.booking_requests for insert
to authenticated
with check (
  private.clinic_subscription_usable(clinic_id)
  and private.has_clinic_role(clinic_id,array['clinic_owner','receptionist']::public.clinic_role[])
);

-- Owners can use only the website capabilities included by their plan.
drop policy if exists site_settings_owner_insert on public.clinic_site_settings;
create policy site_settings_owner_insert
on public.clinic_site_settings for insert
to authenticated
with check (
  (
    private.clinic_feature_enabled(clinic_id,'website')
    and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  )
  or private.is_platform_super_admin()
);

drop policy if exists site_settings_owner_update on public.clinic_site_settings;
create policy site_settings_owner_update
on public.clinic_site_settings for update
to authenticated
using (
  (
    private.clinic_feature_enabled(clinic_id,'website')
    and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  )
  or private.is_platform_super_admin()
)
with check (
  (
    private.clinic_feature_enabled(clinic_id,'website')
    and private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  )
  or private.is_platform_super_admin()
);

create or replace function private.protect_site_entitlements()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') or private.is_platform_super_admin() then
    return new;
  end if;

  if new.theme_key is distinct from old.theme_key
     and new.theme_key<>'modern'
     and not private.clinic_feature_enabled(new.clinic_id,'all_themes') then
    raise exception 'Your clinic plan does not include all website themes';
  end if;

  if new.custom_domain is not null
     and nullif(trim(new.custom_domain),'') is not null
     and not private.clinic_feature_enabled(new.clinic_id,'custom_domain') then
    raise exception 'Custom domains are not available on this clinic plan';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_site_entitlements() from public,anon,authenticated;

drop trigger if exists clinic_site_settings_protect_entitlements on public.clinic_site_settings;
create trigger clinic_site_settings_protect_entitlements
before update on public.clinic_site_settings
for each row execute function private.protect_site_entitlements();

-- Until automated domain provisioning, multi-location, and public API provisioning are shipped,
-- do not advertise them as active paid features.
update public.plans
set features = (features - 'custom_domain' - 'multi_location' - 'api')
               || jsonb_build_object('custom_domain',false,'multi_location',false,'api',false),
    limits = jsonb_set(coalesce(limits,'{}'::jsonb),'{locations}','1'::jsonb,true)
where code in ('starter','pro','enterprise');

-- Tenant-scoped audit trail. Metadata stores changed field names only, never row contents.
alter table public.audit_logs add column if not exists clinic_id uuid references public.clinics(id) on delete cascade;

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon;
revoke insert,update,delete on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

drop policy if exists audit_admin_read on public.audit_logs;
drop policy if exists audit_logs_admin_read on public.audit_logs;
drop policy if exists audit_logs_owner_read on public.audit_logs;
create policy audit_logs_owner_read
on public.audit_logs for select
to authenticated
using (
  private.has_clinic_role(clinic_id,array['clinic_owner']::public.clinic_role[])
  or private.is_platform_super_admin()
);

create or replace function private.audit_tenant_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_row jsonb;
  v_old jsonb;
  v_new jsonb;
  v_clinic_id uuid;
  v_entity_id text;
  v_changed_fields jsonb := '[]'::jsonb;
begin
  v_old := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else '{}'::jsonb end;
  v_new := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  v_row := case when tg_op='DELETE' then v_old else v_new end;

  if not (v_row ? 'clinic_id') then
    return case when tg_op='DELETE' then old else new end;
  end if;

  v_clinic_id := nullif(v_row->>'clinic_id','')::uuid;
  v_entity_id := coalesce(v_row->>'id',v_row->>'clinic_id');

  if tg_op='UPDATE' then
    select coalesce(jsonb_agg(k order by k),'[]'::jsonb)
    into v_changed_fields
    from (
      select key as k
      from jsonb_each(v_new)
      where (v_new->key) is distinct from (v_old->key)
        and key not in ('updated_at')
    ) changed;
  end if;

  if v_clinic_id is not null then
    insert into public.audit_logs (
      clinic_id,actor_user_id,action,entity_type,entity_id,metadata
    )
    values (
      v_clinic_id,
      auth.uid(),
      lower(tg_op),
      tg_table_name,
      v_entity_id,
      case
        when tg_op='UPDATE' then jsonb_build_object('changed_fields',v_changed_fields)
        else '{}'::jsonb
      end
    );
  end if;

  return case when tg_op='DELETE' then old else new end;
end;
$$;

revoke all on function private.audit_tenant_change() from public,anon,authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'patients','appointments','clinical_notes','dental_chart_entries','treatment_plans',
    'invoices','payments','inventory_items','booking_requests','clinic_site_settings','clinic_memberships'
  ]
  loop
    execute format('drop trigger if exists audit_tenant_change on public.%I',v_table);
    execute format(
      'create trigger audit_tenant_change after insert or update or delete on public.%I for each row execute function private.audit_tenant_change()',
      v_table
    );
  end loop;
end $$;

create index if not exists audit_logs_clinic_created_idx
on public.audit_logs(clinic_id,created_at desc);
