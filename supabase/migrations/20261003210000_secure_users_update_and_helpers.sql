-- Migration: secure_users_update_and_helpers
--
-- Goals:
-- 1. Prevent privilege escalation via public.users UPDATE (parent -> admin,
--    switching daycares, etc.) by restricting authenticated users to their own
--    editable profile columns.
-- 2. Resolve Supabase security-advisor warnings for public SECURITY DEFINER
--    helpers that were exposed to anon/authenticated without need.

-- 1. Restrict authenticated UPDATE to safe profile columns only.
--    The existing RLS policy users_update_own already limits rows to the
--    current user; column privileges now limit which columns they can touch.
revoke update on public.users from anon, authenticated;

grant update (
  full_name,
  avatar_url,
  notify_on_post,
  daily_summary_enabled
) on public.users to authenticated;

-- Note: anon has no UPDATE policy on public.users, so it needs no grant.


-- 2. Convert public helper duplicates to SECURITY INVOKER.
--    RLS policies already use private.current_daycare_id(); the public copies
--    are kept only for application convenience. Because they read the caller's
--    own row they work fine under the user's own RLS permissions and no longer
--    trigger the "authenticated can execute SECURITY DEFINER" advisor warning.
create or replace function public.current_daycare_id()
returns uuid
language sql stable
security invoker set search_path = ''
as $$
  select daycare_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns user_role
language sql stable
security invoker set search_path = ''
as $$
  select role from public.users where id = auth.uid();
$$;

-- These helpers are only meaningful for signed-in users.
grant execute on function public.current_daycare_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
revoke execute on function public.current_daycare_id() from anon;
revoke execute on function public.current_user_role() from anon;


-- 3. Remove public/anon execution of the internal event-trigger function.
--    It is not meant to be called via the REST API; it only makes sense when
--    fired by the event trigger itself.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
