# Tasks

## 1. Route groups and layouts

- [x] 1.1 Create `app/(staff)/panel/layout.tsx` that checks `getCurrentUserProfile()` and redirects non-staff/non-admin users to `/familia`; verify that opening `/panel` as `staff`/`admin` succeeds and as `parent` redirects to `/familia`.
- [x] 1.2 Create `app/(family)/familia/layout.tsx` that checks `getCurrentUserProfile()` and redirects staff/admin users to `/panel`; verify that opening `/familia` as `parent` succeeds and as `staff`/`admin` redirects to `/panel`.
- [x] 1.3 Replace `app/page.tsx` with a role-aware redirect (`staff|admin` → `/panel`, `parent` → `/familia`, no session → `/login`); verify each case with a manual request or dev-server navigation.

## 2. Migrate existing staff pages

- [x] 2.1 Move the current feed page content into `app/(staff)/panel/page.tsx` so `/panel` shows the staff feed with the new-post composer; verify the page renders identically to the old `/` for staff.
- [x] 2.2 Move `app/kids/page.tsx` to `app/(staff)/panel/kids/page.tsx` and `app/kids/[id]/page.tsx` to `app/(staff)/panel/kids/[id]/page.tsx`; verify `/panel/kids` and `/panel/kids/<id>` render and `/kids` returns 404.
- [x] 2.3 Update any relative imports or paths inside the moved pages so `npm run build` completes without module-resolution errors.

## 3. Family portal stub

- [x] 3.1 Create `app/(family)/familia/page.tsx` that renders a read-only feed with the heading "TU FAMILIA" and no composer or management controls; verify a parent sees the page and no staff-only UI is present.
- [x] 3.2 Use a feed query that returns only general announcements and posts for children linked to the current parent (`parent_children`); verify that posts for unrelated children are not returned.

## 4. Navigation and redirects

- [x] 4.1 Update the staff sidebar (`components/sidebar.tsx` or a new staff variant) so its links point to `/panel`, `/panel/kids`, `/panel/avisos` and `/panel/mi-cuenta`, and active states still highlight the current page; verify visually on `/panel` and `/panel/kids`.
- [x] 4.2 Create a family sidebar (`components/family-sidebar.tsx`) with links to `/familia`, `/familia/resumen` and `/familia/cuenta`; verify it renders on `/familia` and highlights the active item.
- [x] 4.3 Update all internal redirects: login success, account activation, server actions (`lib/actions/auth.ts`, `activation.ts`, `children.ts`, `invitations.ts`, `posts.ts`) and any `router.push` calls so they target `/panel/*` or `/familia` instead of `/` or `/kids`; verify by performing each flow end-to-end.
- [x] 4.4 Search the codebase for remaining hardcoded `/kids` or `/kids/[id]` paths outside of the route directory; update or remove them; verify `grep -R "['/\"]kids"` returns only route files.

## 5. Verification

- [x] 5.1 Run `npm run lint` and `npx tsc --noEmit`; verify both exit with no errors.
- [x] 5.2 Run `npm run dev`, log in as each role and confirm: `/` redirects correctly, staff routes reject parents, family routes reject staff/admin, and `/familia` does not 404.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
