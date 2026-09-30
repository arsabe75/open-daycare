-- The auth.users trigger uses private.handle_new_user(), so the public copy
-- created earlier is unused. Drop it to avoid confusion and linter warnings.
drop function if exists public.handle_new_user();
