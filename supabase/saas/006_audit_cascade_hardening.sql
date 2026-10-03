-- Prevent tenant audit logging from breaking cascade deletion of a clinic.
-- During ON DELETE CASCADE, child DELETE triggers may fire after the parent clinic
-- is no longer visible to the foreign-key check. Skip audit insertion in that case.

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

  if v_clinic_id is not null
     and exists (select 1 from public.clinics c where c.id=v_clinic_id)
  then
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
