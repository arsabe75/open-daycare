-- The dashboard sign-up and "create user" flows do not send daycare_id,
-- role or full_name in raw_user_meta_data. The original trigger failed hard
-- in those cases, blocking any user creation through Supabase Auth.
--
-- This change makes the trigger defensive: only create the public.users
-- profile when the required metadata is present. When it is missing, the
-- auth user is still created and the profile can be inserted/updated
-- separately.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'daycare_id' then
    insert into public.users (id, daycare_id, role, full_name)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'daycare_id')::uuid,
      coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
    );
  end if;

  return new;
end;
$$;
