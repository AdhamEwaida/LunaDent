-- LunaDent custom domain lifecycle.
-- This migration is intentionally additive and should only be applied after comparing with the live schema.

alter table public.clinic_site_settings
  add column if not exists domain_status text not null default 'not_configured',
  add column if not exists domain_requested_at timestamptz,
  add column if not exists domain_verified_at timestamptz,
  add column if not exists domain_last_checked_at timestamptz,
  add column if not exists domain_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='clinic_site_settings_domain_status_check'
      and conrelid='public.clinic_site_settings'::regclass
  ) then
    alter table public.clinic_site_settings
      add constraint clinic_site_settings_domain_status_check
      check (domain_status in ('not_configured','pending','dns_required','verifying','active','failed'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from public.clinic_site_settings
    where nullif(trim(coalesce(custom_domain,'')), '') is not null
    group by lower(trim(custom_domain))
    having count(*) > 1
  ) then
    raise exception 'Duplicate custom domains must be resolved before enabling case-insensitive domain uniqueness';
  end if;
end $$;

update public.clinic_site_settings
set
  custom_domain = nullif(lower(trim(custom_domain)), ''),
  domain_status = case
    when nullif(trim(coalesce(custom_domain,'')), '') is null then 'not_configured'
    when domain_verified then 'active'
    else 'pending'
  end,
  domain_verified_at = case
    when domain_verified then coalesce(domain_verified_at, updated_at, now())
    else null
  end,
  domain_requested_at = case
    when nullif(trim(coalesce(custom_domain,'')), '') is not null
      then coalesce(domain_requested_at, updated_at, now())
    else null
  end;

create unique index if not exists clinic_site_settings_custom_domain_lower_uidx
on public.clinic_site_settings (lower(custom_domain))
where custom_domain is not null;

create index if not exists clinic_site_settings_domain_status_idx
on public.clinic_site_settings (domain_status)
where custom_domain is not null;

create or replace function private.protect_site_entitlements()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') or private.is_platform_super_admin() then
    if new.custom_domain is not null then
      new.custom_domain := nullif(lower(trim(new.custom_domain)), '');
    end if;
    return new;
  end if;

  if new.theme_key<>'modern'
     and (tg_op='INSERT' or new.theme_key is distinct from old.theme_key)
     and not private.clinic_feature_enabled(new.clinic_id,'all_themes') then
    raise exception 'Your clinic plan does not include all website themes';
  end if;

  if tg_op='INSERT' then
    if new.custom_domain is not null then
      raise exception 'Custom domains are managed through the LunaDent domain connection flow';
    end if;

    if new.domain_verified
       or new.domain_status<>'not_configured'
       or new.domain_requested_at is not null
       or new.domain_verified_at is not null
       or new.domain_last_checked_at is not null
       or new.domain_error is not null then
      raise exception 'Custom domain verification state is managed by the LunaDent platform';
    end if;
  else
    if new.custom_domain is distinct from old.custom_domain then
      raise exception 'Custom domains are managed through the LunaDent domain connection flow';
    end if;

    if new.domain_verified is distinct from old.domain_verified
       or new.domain_status is distinct from old.domain_status
       or new.domain_requested_at is distinct from old.domain_requested_at
       or new.domain_verified_at is distinct from old.domain_verified_at
       or new.domain_last_checked_at is distinct from old.domain_last_checked_at
       or new.domain_error is distinct from old.domain_error then
      raise exception 'Custom domain verification state is managed by the LunaDent platform';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_site_entitlements() from public,anon,authenticated;

drop trigger if exists clinic_site_settings_protect_entitlements on public.clinic_site_settings;
create trigger clinic_site_settings_protect_entitlements
before insert or update on public.clinic_site_settings
for each row execute function private.protect_site_entitlements();

-- Custom domains are a paid website capability now that provider-backed provisioning is implemented.
update public.plans
set features = jsonb_set(coalesce(features,'{}'::jsonb),'{custom_domain}','true'::jsonb,true)
where code in ('pro','enterprise');

update public.plans
set features = jsonb_set(coalesce(features,'{}'::jsonb),'{custom_domain}','false'::jsonb,true)
where code='starter';
