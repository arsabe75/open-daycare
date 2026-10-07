# Design

## Context

The Next.js App Router currently places all authenticated pages under `app/` without route groups. The root page (`app/page.tsx`) loads the staff feed for every authenticated user, hiding the composer only for parents with a client-side `isStaff` flag. The sidebar (`components/sidebar.tsx`) always renders the same navigation items, and the Supabase SSR proxy (`utils/supabase/proxy.ts`) only enforces authentication, not role. The existing role value lives in `public.users.role` and is already fetched via `getCurrentUserProfile()`.

## Goals / Non-Goals

**Goals:**
- Create two clearly separated surfaces: a staff/admin panel and a parent portal.
- Enforce role-based access at the server-route level, not only in UI.
- Migrate existing staff-facing pages into `/panel/*` without duplicating their logic.
- Provide a working `/familia` page so parents have a valid destination after login.
- Update every internal redirect and navigation link to the new URLs.

**Non-Goals:**
- Full implementation of the family feed designs (`familia-feed.dc.html`, `resumen-dia.dc.html`, `familia-cuenta.dc.html`) — only a minimal feed stub.
- Adding role to the JWT or changing Supabase Auth configuration.
- Implementing `/avisos` or `/mi-cuenta` for staff or `/familia/resumen` for families.

## Decisions

### 1. Route groups with explicit path prefixes
- **Choice:** Use `app/(staff)/panel/*` and `app/(family)/familia/*`.
- **Rationale:** Route groups let each side have its own layout without exposing the group name in the URL. The prefixes `/panel` and `/familia` make the URL self-describing and allow simple redirect rules.
- **Alternative considered:** Shared root layout with conditional rendering (`isStaff` branches). Rejected because the sidebars and intended page sets diverge enough that the code would become hard to follow.

### 2. Role checks live in server pages/layouts, not the proxy
- **Choice:** `app/page.tsx` and each route-group `layout.tsx` call `getCurrentUserProfile()` and redirect based on `public.users.role`.
- **Rationale:** The role is already in the application database; adding it to the JWT would require a trigger or Edge Function to keep `app_metadata` in sync. A server layout uses the same query the current home already performs.
- **Alternative considered:** Middleware role check with a JWT claim. Rejected to avoid extra synchronization logic and because `public.users` is the source of truth.

### 3. Root page becomes a redirect hub
- **Choice:** `/` always redirects: `staff|admin` -> `/panel`, `parent` -> `/familia`, guest -> `/login`.
- **Rationale:** There is no single home experience that works for both roles; the redirect avoids a shared page with conditional branches.
- **Alternative considered:** Keep `/` as a unified landing. Rejected because the two sides already have different sidebars and will diverge further.

### 4. Two sidebar components
- **Choice:** Create `components/sidebar.tsx` for the staff panel and a new `components/family-sidebar.tsx` (or rename the existing one) for the family portal.
- **Rationale:** The navigation items, active states and user subtitle are different. A shared component with `isStaff` branches works for one or two items but becomes brittle when pages such as "Resumen del día" exist only for families.
- **Alternative considered:** Single sidebar with role-driven items. Rejected to keep each surface explicit and easy to extend independently.

### 5. Minimal family feed stub
- **Choice:** `app/(family)/familia/page.tsx` renders a page using the existing `HomeView`/`PostCard` components or a lightweight variant, read-only, with no composer.
- **Rationale:** A redirect to `/familia` must not land on a 404. The stub can reuse the existing feed query; later changes will add child filtering and chips.
- **Alternative considered:** Build the full family feed now. Rejected to keep this change focused on separation and protection.

### 6. Update all internal redirects in one pass
- **Choice:** Search for `redirect("/kids"`, `redirect("/"`, `href="/kids`, `/login` after-auth destinations, and activation success redirects; update them to the new paths.
- **Rationale:** Breaking the URLs is acceptable only if every known entry point is migrated at the same time.

## Risks / Trade-offs

- **[Risk]** Existing bookmarks or tests pointing to `/kids` or `/kids/[id]` break after deployment.
  - **Mitigation:** Document the breaking change; update the spec-driven specs and any Playwright tests as part of the implementation.
- **[Risk]** A server-layout role check adds a Supabase query per layout render.
  - **Mitigation:** The query is the same `users` lookup the current home already does; it replaces rather than adds overhead for the staff path and protects routes that were previously unguarded.
- **[Risk]** The family feed stub may show posts intended for the staff feed.
  - **Mitigation:** The stub should use a query that already respects `parent_children` links, or at minimum only render general announcements and posts authored for the parent's linked children. If no such query exists, create a safe minimal one as part of the implementation task.

## Migration Plan

1. Create route groups and layouts.
2. Move current `app/page.tsx` content to `app/(staff)/panel/page.tsx` and update data fetching.
3. Move `app/kids` to `app/(staff)/panel/kids`.
4. Create `app/(family)/familia/page.tsx` with a minimal feed.
5. Replace `app/page.tsx` with the role-aware redirect.
6. Update sidebars, navigation links and action redirects.
7. Verify role-based access: parent hitting `/panel/*` ends at `/familia`, staff/admin hitting `/familia` ends at `/panel`.
