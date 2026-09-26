-- Performance fix: avoid per-row re-evaluation of auth.uid() in RLS policies.

drop policy if exists users_update_own on public.users;

create policy users_update_own on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));


-- Move SECURITY DEFINER helpers out of the exposed public schema so they are
-- not callable via the REST API (resolves anon/authenticated advisor warnings).

create schema if not exists private;

-- Helper used by RLS policies to obtain the current user's daycare_id.
-- SECURITY DEFINER bypasses RLS on public.users, avoiding infinite recursion.
create or replace function private.current_daycare_id()
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select daycare_id from public.users where id = (select auth.uid());
$$;

comment on function private.current_daycare_id() is
  'Returns the authenticated user daycare_id; used by RLS policies.';

-- Trigger function that creates the public profile after auth.users insertion.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

comment on function private.handle_new_user() is
  'Creates the public.users profile after a new auth.users row is inserted.';

-- Grant the authenticated role just enough access to use the helper inside RLS.
-- The private schema is not exposed via PostgREST, so these grants do not
-- surface as REST RPC endpoints.
grant usage on schema private to authenticated;
grant execute on function private.current_daycare_id() to authenticated;
revoke execute on function private.current_daycare_id() from public;
revoke execute on function private.handle_new_user() from public;


-- Update public policies to use the private helper.

drop policy if exists users_select_same_daycare on public.users;

create policy users_select_same_daycare on public.users
  for select to authenticated
  using (daycare_id = private.current_daycare_id());


drop policy if exists daycares_select_own on public.daycares;

create policy daycares_select_own on public.daycares
  for select to authenticated
  using (id = private.current_daycare_id());


-- Point the auth trigger to the private helper.

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();


-- Remove the old public copies.

drop function if exists public.current_daycare_id();
drop function if exists public.handle_new_user();
