-- The invitation branch in handle_new_user was using the JSONB `?` key-exists
-- operator, which could be skipped in some trigger contexts. Switch to an
-- explicit `is not null` check on the extracted value.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv_id uuid;
  inv_record public.invitations%rowtype;
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  if new.raw_user_meta_data ->> 'invitation_id' is not null then
    inv_id := (new.raw_user_meta_data ->> 'invitation_id')::uuid;

    select * into inv_record
    from public.invitations
    where id = inv_id
    for update;

    if inv_record is null then
      raise exception 'Invitation not found';
    end if;

    if inv_record.status != 'pending' then
      raise exception 'Invitation is not pending';
    end if;

    if inv_record.expires_at <= now() then
      raise exception 'Invitation has expired';
    end if;

    if lower(inv_record.email) != lower(new.email) then
      raise exception 'Email does not match invitation';
    end if;

    update public.invitations
    set status = 'accepted', accepted_at = now()
    where id = inv_id;

    insert into public.parent_children (parent_id, child_id, relationship)
    values (new.id, inv_record.child_id, inv_record.relationship);
  end if;

  return new;
end;
$$;
