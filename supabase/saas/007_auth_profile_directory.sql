-- Trusted auth email directory and private trigger functions.
-- Email is copied from auth.users (trusted auth data), never from user_metadata.

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email=lower(u.email)
from auth.users u
where u.id=p.id
  and u.email is not null
  and p.email is distinct from lower(u.email);

create unique index if not exists profiles_email_uidx
  on public.profiles(email)
  where email is not null;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.profiles (id,role,full_name,email)
  values (
    new.id,
    'patient'::public.app_role,
    coalesce(new.raw_user_meta_data ->> 'full_name',new.email),
    case when new.email is null then null else lower(new.email) end
  )
  on conflict (id) do update
  set email=excluded.email,
      full_name=coalesce(public.profiles.full_name,excluded.full_name);

  return new;
end;
$$;

create or replace function private.sync_profile_auth_email()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.profiles
  set email=case when new.email is null then null else lower(new.email) end
  where id=new.id;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public,anon,authenticated;
revoke all on function private.sync_profile_auth_email() from public,anon,authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.sync_profile_auth_email();

drop function if exists public.handle_new_user();
