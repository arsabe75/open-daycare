# SPEC 12 — Publicaciones persistidas para staff (con imágenes)

> **Estado:** Implementado  
> **Depende de:** SPEC 06, SPEC 09  
> **Fecha:** 2026-10-04  
> **Objetivo:** Evolucionar el diálogo "Nueva publicación" de SPEC 06 para persistir posts en Supabase, permitir adjuntar hasta 3 imágenes privadas, y que el feed lea de la base de datos con visibilidad por rol.

## Alcance

**Dentro:**

- Migración versionada que crea:
  - `post_type` enum con los 7 tipos actuales de UI: `food`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.
  - Tablas `posts`, `post_children`, `post_photos`, `reactions`, `comments` con PKs, FKs, índices, `updated_at` y RLS.
  - Bucket privado `post-photos` con políticas de Storage para staff/admin de la misma guardería.
- Server actions en `lib/actions/posts.ts`:
  - `createPost(formData)` — valida rol staff/admin, inserta post + `post_children` + sube imágenes a `post-photos/{daycare_id}/{post_id}/{uuid}` y registra `post_photos`. Límite 3 imágenes, 3 MB cada una. Si falla cualquier paso, borra las imágenes ya subidas y devuelve error.
  - `getFeedPosts()` — staff/admin: todos los posts de su `daycare_id`; parent: posts que etiquetan a sus hijos + posts de tipo `announcement` de la sala de sus hijos.
  - `addReaction(postId, type)` y `addComment(postId, body)` — solo usuarios que pueden ver el post.
- Tipos actualizados en `lib/data/posts.ts`: `Post` ahora usa `id: string` (uuid), incluye `photos: PostPhoto[]`, `likes`, `comments` como contadores, y mantiene campos derivados (`childName`, `audience`, `time`, `authorNote`).
- UI:
  - `components/feed/new-post-dialog.tsx`: subida real de imágenes con preview, botón de eliminar, validación de cantidad/tamaño, spinner en "Publicar", mensajes de error.
  - `components/feed/home-view.tsx`: lee `initialPosts` desde el server, refresca con `revalidatePath`/`router.refresh()` tras publicar.
  - `components/feed/post-card.tsx`: muestra galería de fotos, permite reaccionar y ver/agregar comentarios.
- Eliminar los 3 posts mock de `lib/data/posts.ts` y dejar solo los tipos/exportaciones.
- Proteger la ruta/API: server action rechaza usuarios `parent`; el feed filtra por rol.

**Fuera de alcance:**

- Notificaciones push/email.
- Edición/eliminación de posts.
- Moderación de comentarios.
- Página de detalle de publicación; comentarios se muestran inline o en un drawer simple.

## Modelo de datos

```sql
-- en migración

create type public.post_type as enum (
  'food', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users (id) on delete restrict,
  room_id      uuid references public.rooms (id) on delete set null,
  type         public.post_type not null,
  title        text,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.post_children (
  post_id  uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  url        text not null, -- storage path
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null default 'love',
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.users (id) on delete restrict,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Storage:

- Bucket `post-photos` privado.
- Path: `{daycare_id}/{post_id}/{uuid}.{ext}`.
- RLS en `storage.objects`:
  - `insert`/`select`/`update`/`delete` para `authenticated` con `bucket_id = 'post-photos'` y `(storage.foldername(name))[1] = current_daycare_id()::text`.

## Plan de implementación

1. Escribir migración SQL `supabase/migrations/20261004XXXXXX_create_posts_and_storage.sql`.
2. Aplicar migración en el proyecto remoto con MCP `apply_migration`.
3. Actualizar `lib/data/posts.ts`: tipos + eliminar mocks.
4. Crear `lib/actions/posts.ts` con server actions.
5. Actualizar `components/feed/new-post-dialog.tsx` para subida real de imágenes.
6. Actualizar `components/feed/home-view.tsx` y `app/page.tsx` para leer de DB.
7. Actualizar `components/feed/post-card.tsx` para fotos, reacciones y comentarios.
8. Verificar: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Criterios de aceptación

- [x] Un usuario `staff` o `admin` puede abrir el diálogo "Nueva publicación", elegir sala/niños, tipo, descripción y adjuntar 0-3 imágenes de hasta 3 MB.
- [x] Al publicar, el post se persiste en la base de datos, las imágenes se suben a Storage privado y el feed se actualiza.
- [x] Si falla la subida, no quedan registros parciales ni imágenes huérfanas y se muestra el error.
- [x] Un `parent` solo ve posts que etiquetan a sus hijos o anuncios de la sala de sus hijos.
- [x] Los posts mock desaparecen del feed; el home lee siempre de la base de datos.
- [x] Se pueden agregar reacciones y comentarios en los posts visibles.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** Server Actions de Next.js para create/get/reacciones/comentarios.
- **Sí:** Imágenes privadas en Storage con signed URLs de corta duración.
- **Sí:** Transacción manual (cleanup de imágenes en caso de error) porque Storage y Postgres no comparten transacción.
- **Sí:** Los posts pueden tener `room_id` y `post_children` simultáneamente.
- **No:** Notificaciones en esta iteración.
- **No:** Edición/eliminación de posts.
