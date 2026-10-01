-- LunaDent commercial guards for owner-managed clinic settings.
-- Keeps platform-controlled fields and plan-only website capabilities enforced server-side.

create or replace function private.protect_clinic_platform_fields()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin')
     and not private.is_platform_super_admin() then
    if new.status is distinct from old.status then
      raise exception 'Clinic status is managed by the LunaDent platform';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Clinic identity cannot be changed';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Clinic creation timestamp cannot be changed';
    end if;
    if not private.clinic_subscription_usable(old.id) then
      raise exception 'Clinic subscription is not active';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.protect_site_platform_fields()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin')
     and not private.is_platform_super_admin() then
    if new.clinic_id is distinct from old.clinic_id then
      raise exception 'Website tenant identity cannot be changed';
    end if;
    if new.domain_verified is distinct from old.domain_verified then
      raise exception 'Custom domain verification is managed by the LunaDent platform';
    end if;
    if not private.clinic_feature_enabled(old.clinic_id,'website') then
      raise exception 'Website Builder is not available for this clinic plan';
    end if;
    if new.custom_domain is distinct from old.custom_domain
       and nullif(trim(coalesce(new.custom_domain,'')),'') is not null
       and not private.clinic_feature_enabled(old.clinic_id,'custom_domain') then
      raise exception 'Custom domains are not included in this clinic plan';
    end if;
    if new.theme_key is distinct from old.theme_key
       and exists (
         select 1
         from public.themes t
         where t.key=new.theme_key and t.premium=true
       )
       and not private.clinic_feature_enabled(old.clinic_id,'all_themes') then
      raise exception 'Premium themes are not included in this clinic plan';
    end if;
  end if;
  return new;
end;
$$;
