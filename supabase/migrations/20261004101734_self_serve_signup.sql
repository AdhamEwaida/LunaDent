-- Self-serve clinic signup, managed Vercel aliases, and abuse-safe signup accounting.

alter table public.clinic_site_settings
  add column if not exists platform_subdomain text,
  add column if not exists platform_subdomain_created_at timestamptz;

create unique index if not exists clinic_site_settings_platform_subdomain_lower_uidx
  on public.clinic_site_settings (lower(platform_subdomain))
  where platform_subdomain is not null;

create table if not exists public.saas_signup_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  email_hash text not null,
  outcome text not null default 'started'
    check (outcome in ('started','success','rejected','failed')),
  created_at timestamptz not null default now()
);

alter table public.saas_signup_attempts enable row level security;
revoke all on public.saas_signup_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.saas_signup_attempts to service_role;
grant usage, select on sequence public.saas_signup_attempts_id_seq to service_role;

create index if not exists saas_signup_attempts_ip_created_idx
  on public.saas_signup_attempts (ip_hash, created_at desc);

create index if not exists saas_signup_attempts_email_created_idx
  on public.saas_signup_attempts (email_hash, created_at desc);

create or replace function public.provision_self_serve_clinic(
  p_user_id uuid,
  p_owner_name text,
  p_clinic_name text,
  p_slug text,
  p_plan_code text,
  p_theme_key text,
  p_platform_subdomain text default null,
  p_timezone text default 'UTC',
  p_currency text default 'USD'
)
returns table (
  clinic_id uuid,
  clinic_slug text,
  platform_subdomain text,
  plan_code text,
  theme_key text
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_plan public.plans%rowtype;
  v_theme public.themes%rowtype;
  v_clinic_id uuid;
  v_now timestamptz := now();
begin
  if p_user_id is null or not exists (select 1 from public.profiles p where p.id=p_user_id) then
    raise exception 'user profile not found';
  end if;

  if nullif(trim(p_clinic_name),'') is null then
    raise exception 'clinic name is required';
  end if;

  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or length(p_slug) < 2 or length(p_slug) > 60 then
    raise exception 'invalid clinic slug';
  end if;

  if exists (select 1 from public.clinics c where c.slug=p_slug) then
    raise exception 'clinic slug is already in use';
  end if;

  select *
  into v_plan
  from public.plans p
  where p.code=p_plan_code and p.active
  limit 1;

  if not found then
    raise exception 'invalid or inactive plan';
  end if;

  select *
  into v_theme
  from public.themes t
  where t.key=p_theme_key and t.active
  limit 1;

  if not found then
    raise exception 'invalid or inactive theme';
  end if;

  if coalesce((v_plan.features->>'all_themes')::boolean,false)=false and v_theme.key<>'modern' then
    raise exception 'selected theme is not included in this plan';
  end if;

  if p_platform_subdomain is not null and (
    lower(p_platform_subdomain) !~ '^clinic-[a-z0-9-]+-lunadent\.vercel\.app$'
    or length(p_platform_subdomain)>253
  ) then
    raise exception 'invalid managed LunaDent hostname';
  end if;

  update public.profiles
  set full_name=coalesce(nullif(trim(p_owner_name),''),full_name),
      active=true
  where id=p_user_id;

  insert into public.clinics (
    name,slug,status,currency,timezone,locale,onboarding_completed
  )
  values (
    trim(p_clinic_name),
    p_slug,
    'active'::public.clinic_status,
    upper(coalesce(nullif(trim(p_currency),''),'USD')),
    coalesce(nullif(trim(p_timezone),''),'UTC'),
    'en',
    false
  )
  returning id into v_clinic_id;

  insert into public.clinic_memberships (
    clinic_id,user_id,role,active
  )
  values (
    v_clinic_id,p_user_id,'clinic_owner'::public.clinic_role,true
  );

  insert into public.subscriptions (
    clinic_id,plan_id,status,trial_ends_at,current_period_end,billing_provider
  )
  values (
    v_clinic_id,
    v_plan.id,
    'active'::public.subscription_status,
    null,
    v_now + interval '30 days',
    'demo'
  );

  insert into public.clinic_site_settings (
    clinic_id,
    theme_key,
    published,
    platform_subdomain,
    platform_subdomain_created_at,
    site_title,
    tagline,
    tokens,
    sections,
    content
  )
  values (
    v_clinic_id,
    v_theme.key,
    false,
    case when p_platform_subdomain is null then null else lower(p_platform_subdomain) end,
    case when p_platform_subdomain is null then null else v_now end,
    trim(p_clinic_name),
    'Modern dental care, built around you.',
    v_theme.default_tokens,
    jsonb_build_array(
      jsonb_build_object('key','hero','enabled',true),
      jsonb_build_object('key','services','enabled',true),
      jsonb_build_object('key','doctors','enabled',true),
      jsonb_build_object('key','journey','enabled',true),
      jsonb_build_object('key','booking','enabled',true),
      jsonb_build_object('key','contact','enabled',true)
    ),
    jsonb_build_object(
      'hero',
      jsonb_build_object(
        'eyebrow',upper(trim(p_clinic_name)),
        'title','Confident smiles start with thoughtful care.',
        'subtitle','Book online and manage your dental journey securely.',
        'primaryCta','Book Consultation',
        'secondaryCta','Explore Treatments'
      )
    )
  );

  insert into public.treatments (
    clinic_id,code,name_en,duration_minutes,default_price,active
  )
  values
    (v_clinic_id,'CONSULT','Consultation',30,0,true),
    (v_clinic_id,'FILL','Composite Filling',45,0,true),
    (v_clinic_id,'RCT','Root Canal Treatment',90,0,true),
    (v_clinic_id,'CROWN','Dental Crown',60,0,true),
    (v_clinic_id,'IMPLANT','Dental Implant',90,0,true),
    (v_clinic_id,'WHITEN','Teeth Whitening',60,0,true);

  insert into public.rooms (clinic_id,name,active)
  values
    (v_clinic_id,'Chair 1',true),
    (v_clinic_id,'Chair 2',true);

  insert into public.clinic_business_hours (
    clinic_id,weekday,enabled,open_time,close_time,slot_minutes
  )
  select
    v_clinic_id,
    d.weekday,
    case when d.weekday between 1 and 6 then true else false end,
    case
      when d.weekday between 1 and 5 then '09:00'::time
      when d.weekday=6 then '10:00'::time
      else null
    end,
    case
      when d.weekday between 1 and 5 then '17:00'::time
      when d.weekday=6 then '14:00'::time
      else null
    end,
    30
  from generate_series(0,6) as d(weekday);

  return query
  select v_clinic_id,p_slug,case when p_platform_subdomain is null then null else lower(p_platform_subdomain) end,v_plan.code,v_theme.key;
end;
$$;

revoke all on function public.provision_self_serve_clinic(
  uuid,text,text,text,text,text,text,text,text
) from public,anon,authenticated;
grant execute on function public.provision_self_serve_clinic(
  uuid,text,text,text,text,text,text,text,text
) to service_role;
