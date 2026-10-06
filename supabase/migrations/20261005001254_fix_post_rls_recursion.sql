
drop policy if exists posts_select_parent on public.posts;

create policy posts_select_parent on public.posts
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and public.posts.room_id is not null
    and exists (
      select 1
      from public.parent_children pcc
      join public.children c on c.id = pcc.child_id
      where pcc.parent_id = (select auth.uid())
        and c.room_id = public.posts.room_id
    )
  );

drop policy if exists post_children_select_parent on public.post_children;

create policy post_children_select_parent on public.post_children
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and exists (
      select 1
      from public.parent_children pcc
      where pcc.parent_id = (select auth.uid())
        and pcc.child_id = public.post_children.child_id
    )
  );

create or replace function private.parent_can_see_post(p_parent_id uuid, p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        p.room_id in (
          select c.room_id
          from public.parent_children pcc
          join public.children c on c.id = pcc.child_id
          where pcc.parent_id = p_parent_id
        )
        or exists (
          select 1
          from public.post_children pc
          where pc.post_id = p.id
            and pc.child_id in (
              select pcc.child_id
              from public.parent_children pcc
              where pcc.parent_id = p_parent_id
            )
        )
      )
  );
$$;

comment on function private.parent_can_see_post(uuid, uuid) is 'Returns true when a parent is allowed to see a given post.';

drop policy if exists post_photos_select_parent on public.post_photos;

create policy post_photos_select_parent on public.post_photos
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and private.parent_can_see_post((select auth.uid()), post_id)
  );

drop policy if exists reactions_select_parent on public.reactions;

create policy reactions_select_parent on public.reactions
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and private.parent_can_see_post((select auth.uid()), post_id)
  );

drop policy if exists comments_select_parent on public.comments;

create policy comments_select_parent on public.comments
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and private.parent_can_see_post((select auth.uid()), post_id)
  );

drop policy if exists reactions_insert_own on public.reactions;

create policy reactions_insert_own on public.reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      private.current_user_role() in ('staff','admin')
      and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
    )
    or (
      private.current_user_role() = 'parent'
      and private.parent_can_see_post((select auth.uid()), post_id)
    )
  );

drop policy if exists comments_insert on public.comments;

create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
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
