
drop policy if exists reactions_insert_own on public.reactions;

create policy reactions_insert_own on public.reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (
        private.current_user_role() in ('staff','admin')
        and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
      )
      or (
        private.current_user_role() = 'parent'
        and private.parent_can_see_post((select auth.uid()), post_id)
      )
    )
  );
;
