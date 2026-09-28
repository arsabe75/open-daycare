-- Supabase functions in the public schema are executable by PUBLIC by default,
-- which causes linter warnings for internal SECURITY DEFINER helpers.
-- Revoke PUBLIC access from the internal helpers (RLS policies and triggers
-- still work because they share the same owner) and keep invitation_by_code
-- explicitly exposed to anon and authenticated.

revoke execute on function public.current_daycare_id() from public, anon, authenticated;
revoke execute on function public.current_user_role() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.invitation_by_code(text) to anon, authenticated;
