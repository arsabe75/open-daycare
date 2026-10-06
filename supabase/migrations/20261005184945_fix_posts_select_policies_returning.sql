-- Migration: fix_posts_select_policies_returning
--
-- PostgreSQL 17 enforces SELECT RLS policies on rows returned by INSERT ... RETURNING.
-- posts_select_staff depended on private.post_in_daycare(), which re-queries public.posts
-- by id; the row being inserted is not visible to the command's own snapshot, so any
-- supabase-js .insert().select() (e.g. createPost) always failed with:
--   "new row violates row-level security policy for table \"posts\"".
--
-- This migration replaces the staff SELECT policy with an equivalent expression that
-- reads only the current row's columns plus committed rows in rooms/post_children,
-- making it safe for RETURNING. It also recreates the missing parent SELECT policy
-- using the same non-recursive shape now that child/parent_children policies no longer
-- reference public.posts.

-- ---------------------------------------------------------------------------
-- posts: staff can see posts whose room (or any tagged child's room) is in
-- their daycare. Evaluated against the current row, so it works with RETURNING.
-- ---------------------------------------------------------------------------

drop policy if exists posts_select_staff on public.posts;

create policy posts_select_staff on public.posts
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and (
      exists (
        select 1
        from public.rooms r
        where r.id = posts.room_id
          and r.daycare_id = private.current_daycare_id()
      )
      or exists (
        select 1
        from public.post_children pc
        join public.children c on c.id = pc.child_id
        join public.rooms r2 on r2.id = c.room_id
        where pc.post_id = posts.id
          and r2.daycare_id = private.current_daycare_id()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- posts: parents can see posts that tag one of their children, plus room
-- announcements for rooms where they have children.
-- ---------------------------------------------------------------------------

drop policy if exists posts_select_parent on public.posts;

create policy posts_select_parent on public.posts
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and (
      exists (
        select 1
        from public.post_children pc
        join public.parent_children pcc on pcc.child_id = pc.child_id
        where pc.post_id = posts.id
          and pcc.parent_id = (select auth.uid())
      )
      or (
        posts.type = 'announcement'
        and posts.room_id is not null
        and exists (
          select 1
          from public.parent_children pcc
          join public.children c on c.id = pcc.child_id
          where pcc.parent_id = (select auth.uid())
            and c.room_id = posts.room_id
        )
      )
    )
  );
