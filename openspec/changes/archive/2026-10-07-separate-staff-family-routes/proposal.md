# Proposal

## Why

Today the application uses a single navigation structure and shared pages for staff and families. The sidebar offers the same items to every authenticated user, and pages such as `/kids` are reachable by parents even though they are intended for staff. This creates a confusing experience and a data-access risk: parents see staff-oriented UI and can navigate to sections that should be staff-only. Separating the staff panel from the family portal gives each role a clear, safe place to work.

## What Changes

- Introduce two route groups in the Next.js App Router:
  - `(staff)/panel/*` for staff and admin workflows.
  - `(family)/familia/*` for parent workflows.
- Create a dedicated layout for each group that renders the correct sidebar and validates the user's role on the server.
- Turn the current home page (`/`) into a role-aware redirect:
  - `staff` and `admin` users go to `/panel`.
  - `parent` users go to `/familia`.
  - Unauthenticated users go to `/login`.
- Move existing staff-facing pages into the panel:
  - `/` feed → `/panel`.
  - `/kids` → `/panel/kids`.
  - `/kids/[id]` → `/panel/kids/[id]`.
  - **BREAKING**: existing `/kids` and `/kids/[id]` URLs will no longer be valid.
- Add a minimal `/familia` page so the parent redirect has a working destination.
- Update internal links, post-activation/post-login redirects, and server-action redirects to use the new paths.
- Keep the Supabase SSR proxy responsible only for authentication; role checks live in the route-group layouts and root page.

## Capabilities

### New Capabilities

- `role-based-navigation`: Authenticated users are redirected to the correct side of the application based on their role, and users cannot access routes meant for a different role.
- `staff-panel`: A dedicated workspace with its own layout and navigation for staff and admin users.
- `family-portal`: A dedicated area with its own layout and navigation for parents.

### Modified Capabilities

- None.

## Impact

- App Router file layout under `app/`.
- `components/sidebar.tsx` and `components/sidebar-with-dialog.tsx` (paths and active states).
- `app/page.tsx` (new redirect behavior).
- Server actions and forms that redirect to `/kids` or `/`.
- Any existing bookmarks or tests that rely on `/kids` and `/kids/[id]`.
