-- RLS policies reference these SECURITY DEFINER helpers, so the
-- authenticated role needs EXECUTE on them even though they are not meant
-- to be called directly via RPC.

grant execute on function public.current_daycare_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
