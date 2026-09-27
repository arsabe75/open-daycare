# SPEC 10 — Tablas `rooms` y `children` + mantenimiento real en `/kids`

> **Estado:** Implementado
> **Depende de:** SPEC 02 (UI /kids y perfil), SPEC 04 (diálogo de alta), SPEC 07 (`daycares` + flujo CLI), SPEC 08 (`users`, RLS, `current_daycare_id()`), SPEC 09 (auth real y rutas protegidas)
> **Fecha:** 2026-09-27
> **Objetivo:** Crear las tablas `rooms` y `children` (enum `child_status`, RLS solo staff, seed de 3 salas sin niños) y reemplazar los mocks de `/kids` por datos reales con alta, edición, perfil y archivado.

## Alcance

**Dentro:**

- `supabase/migrations/<timestamp>_create_rooms_children.sql` (generado con `npx supabase migration new create_rooms_children`):
  - **Enum:** `public.child_status` (`active`, `archived`).
  - **Tabla `public.rooms`** según el diccionario: `id uuid PK default gen_random_uuid()`, `daycare_id uuid not null references daycares on delete restrict`, `name text not null`, `created_at timestamptz not null default now()`. Índice `rooms_daycare_id_idx`. RLS activado.
  - **Tabla `public.children`** según el diccionario: `id uuid PK default gen_random_uuid()`, `room_id uuid not null references rooms on delete restrict`, `full_name text not null`, `birth_date date not null`, `enrolled_at date not null default current_date`, `medical_notes text` (nullable), `allergy_tags text[] not null default '{}'`, `photo_consent boolean not null default true`, `status child_status not null default 'active'`, `created_at`/`updated_at timestamptz not null default now()`. Índice `children_room_id_idx`. Trigger `updated_at` reusando `public.set_updated_at()` (SPEC 08). RLS activado.
  - **Helper `public.current_user_role()`:** `stable`, `security definer`, `set search_path = public` — devuelve el `role` del usuario autenticado (mismo patrón que `current_daycare_id()`, evita recursión RLS sobre `users`).
  - **Políticas RLS:**
    - `rooms_select_own`: SELECT donde `daycare_id = current_daycare_id()` (sin INSERT/UPDATE/DELETE: las salas se administran por seed/CLI).
    - `children_select_staff`, `children_insert_staff`, `children_update_staff`: solo `current_user_role() in ('staff','admin')` y la sala del niño pertenece al propio daycare (`exists` sobre `rooms` con `current_daycare_id()`). Sin políticas DELETE — archivar es UPDATE de `status`.
  - `comment on table/column` breves en inglés.
- `supabase/seed.sql` (extender, idempotente): 3 salas con UUIDs fijos del daycare seed `00000000-0000-0000-0000-000000000001` — `…011` **Soles**, `…012` **Lunas**, `…013` **Arcoíris**; `on conflict (id) do nothing`. **Ningún niño** en el seed.
- Aplicar con `npx supabase db push` + seed en remoto; verificación MCP (`list_tables`, `list_migrations`, selects, RLS anónima → 0 filas, `get_advisors` sin avisos nuevos).
- **Capa de datos Next.js (server):**
  - `lib/child-types.ts` (nuevo): tipos view-model `Child`, `Avatar`, `LinkedParent`, `ParentRelation`, `ParentStatus` (salen de `lib/data/children.ts`).
  - `lib/allergies.ts` (nuevo): catálogo fijo EN→ES — `peanut`→MANÍ, `lactose`→LACTOSA, `gluten`→GLUTEN, `egg`→HUEVO, `fish`→PESCADO, `shellfish`→MARISCOS, `other`→OTRA.
  - `lib/data/rooms.ts` (reescrito): `getRooms(): Promise<Room[]>` con el cliente de `utils/supabase/server`, orden `created_at, name`.
  - `lib/data/children.ts` (reescrito): `getActiveChildrenWithRoom()` y `getActiveChildById(id)` (select con join de `rooms.name`, solo `status='active'`). El array mock muda a `lib/data/mock-children.ts` (uso exclusivo del feed, que sigue mockeado).
  - `lib/actions/children.ts` (nuevo, `"use server"`): `createChild`, `updateChild`, `archiveChild` — validan servidor (nombre requerido, fecha válida no futura, sala del daycare), operan con el cliente server (RLS refuerza) y hacen `revalidatePath('/kids')` y `revalidatePath('/kids/[id]')`; devuelven `{ error }` en fallo.
  - `lib/child-utils.ts`: caen `buildChild`/`nextNumericId`; se agregan `mapChildToViewModel(row)` (inicial y paleta por hash estable del UUID vía `deriveAvatar`, edad con `calculateAge(birth_date)`, `birthDate`/`admission` formateados, badge = primera etiqueta traducida, notas = `medical_notes` o etiquetas unidas).
- **UI `/kids`:**
  - `child-form-dialog.tsx` (reemplaza `add-child-dialog.tsx`): modo alta y edición (prop opcional `child` para precargar), input libre de alergias → chips multi-select del catálogo, `useActionState` contra las server actions, cierre en éxito y error inline.
  - `kids-view.tsx`: recibe rooms y children del server; **agrupa por sala** (encabezado `SALA <NOMBRE> · X niños` en orden del seed, salas vacías con mensaje sutil); el alta/edición ya no muta estado local — la lista se refresca por revalidación.
  - `search-box.tsx`: controlado (sin `readOnly`), filtra client-side por nombre dentro de la lista cargada; mientras se busca, solo se muestran los grupos con coincidencias.
  - `app/kids/[id]/page.tsx`: consulta real por UUID; inexistente o archivado → `notFound()`. Botón **Editar** abre el `ChildFormDialog` en modo edición; nuevo botón **Archivar** con diálogo de confirmación → `archiveChild` → `redirect('/kids')`.
  - `linked-parents.tsx`: con `linkedParents: []` renderiza estado vacío "Sin tutores vinculados" y conserva el botón "Vincular otro padre" con el modal de SPEC 05 (el guardado real queda para el spec de `parent_children`).
  - `child-card.tsx`, `child-details.tsx`, `allergy-alert.tsx`: ajustes menores al view-model.
  - Feed: `new-post-dialog.tsx` y `post-utils.ts` cambian su import a `lib/data/mock-children.ts`.

**Fuera de alcance (para specs futuros):**

- Tabla `parent_children`, vinculaciones reales e `invitations` (SPEC 05 queda desconectado).
- Feed real (`posts`, `post_children`): el home sigue con mocks.
- Reactivar niños archivados y cualquier UI de archivados.
- Gestión de salas desde la UI (alta/edición de rooms); foto real del niño (`avatar_url`/Storage) y campo de consentimiento en formularios.
- Acceso de padres a `children` (RLS los deja fuera hasta que exista `parent_children`).

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_rooms_children.sql (esqueleto)
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id) on delete restrict,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id) on delete restrict,
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null default current_date,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

-- RLS: rooms_select_own (daycare propio); children_select/insert/update_staff
-- (rol staff/admin + sala del daycare propio); sin DELETE.
-- + índices rooms_daycare_id_idx, children_room_id_idx, trigger set_updated_at en children.
```

```ts
// lib/child-types.ts — view-model que consumen los componentes (sin mocks)
export interface Child {
  id: string; // UUID de public.children
  name: string; // full_name
  age: number; // derivado de birth_date
  room: string; // rooms.name
  avatar: Avatar; // derivado: inicial + paleta por hash estable del id
  allergyBadge?: string; // primera allergy_tag traducida a ES
  allergyNotes?: string; // medical_notes ?? etiquetas unidas
  birthDate: string; // "12 mar 2022"
  admission: string; // "feb 2025" (desde enrolled_at)
  linkedParents: LinkedParent[]; // [] hasta el spec de parent_children
}
```

## Plan de implementación

1. Cargar la skill `/supabase-postgres-best-practices`; consultar Context7 (`supabase/docs`) por RLS con arrays Postgres y políticas multi-tabla.
2. `npx supabase migration new create_rooms_children` y escribir el SQL completo (enum, tablas, índices, trigger, helper `current_user_role()`, políticas, comments).
3. Extender `supabase/seed.sql` con las 3 salas (UUIDs fijos, `on conflict do nothing`); `npx supabase db push` + aplicar seed en remoto.
4. Verificación MCP: estructura de `rooms`/`children`, 3 salas y 0 niños, RLS anónima → 0 filas, `get_advisors` sin avisos nuevos, re-ejecutar seed no duplica.
5. Crear `lib/child-types.ts` y `lib/allergies.ts`; mover los mocks del feed a `lib/data/mock-children.ts` y actualizar imports de `new-post-dialog.tsx`/`post-utils.ts`. Prueba manual: `/` sigue renderizando el feed mock.
6. Reescribir `lib/data/rooms.ts` y `lib/data/children.ts` como consultas server; adaptar `lib/child-utils.ts` (mapper + hash de paleta).
7. Crear `lib/actions/children.ts` con `createChild`, `updateChild`, `archiveChild` (validación + `revalidatePath`).
8. Convertir el diálogo en `child-form-dialog.tsx` (alta/edición, chips de alergias, `useActionState`). Prueba manual: alta desde `/kids` persiste tras recargar.
9. Reescribir `kids-view.tsx` (agrupación por sala, salas vacías) y activar `search-box.tsx` como filtro local. Prueba manual: 3 grupos visibles con 0 niños, filtro por nombre funciona.
10. Actualizar `app/kids/page.tsx` y `app/kids/[id]/page.tsx` (consultas reales, `notFound()`, Editar/Archivar con confirmación); estado vacío en `linked-parents.tsx`.
11. Verificación manual completa con Playwright (login staff → alta → listado por sala → perfil → edición → archivado → `/kids/[id]` archivado da 404).
12. `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Criterios de aceptación

- [x] La migración `create_rooms_children` existe en `supabase/migrations/` y en el historial remoto; enum `child_status` creado.
- [x] `public.rooms` y `public.children` tienen exactamente las columnas del diccionario, con defaults (`enrolled_at` CURRENT_DATE, `photo_consent` true, `allergy_tags` `'{}'`, `status` 'active'), FKs `on delete restrict`, índices por FK y trigger `updated_at` en `children`.
- [x] RLS activado en ambas tablas: SELECT de `rooms` por daycare propio; SELECT/INSERT/UPDATE de `children` solo staff/admin del daycare; sin DELETE; consulta anónima → 0 filas; un usuario `parent` no lee `children`.
- [x] El seed dejó exactamente 3 salas (Soles, Lunas, Arcoíris, UUIDs `…011/…012/…013`) y 0 niños; re-ejecutarlo no duplica.
- [x] `/kids` lista niños reales agrupados por sala con encabezado y conteo; las 3 salas se muestran aunque estén vacías; el buscador filtra por nombre en la lista cargada.
- [x] Alta desde el diálogo persiste en `public.children` (con `allergy_tags` del catálogo en inglés), sobrevive recargar la página y el niño aparece en el grupo de su sala.
- [x] El perfil `/kids/[id]` muestra datos reales (edad y fechas derivadas, badge de alergia traducido a ES); Editar abre el diálogo precargado y guardar actualiza la DB; Archivar pide confirmación, pone `status='archived'` y redirige a `/kids`.
- [x] Un niño archivado desaparece del listado y su perfil responde 404; la fila sigue en la DB.
- [x] La sección de tutores muestra el estado vacío "Sin tutores vinculados" junto con el botón "Vincular otro padre"; al hacer clic se abre el modal de SPEC 05 (el guardado real queda para el spec de `parent_children`).
- [x] El feed (`/`) sigue funcionando con sus mocks (`lib/data/mock-children.ts`); ningún componente de `/kids` importa datos mock.
- [x] `get_advisors` security/performance sin avisos nuevos por `rooms`/`children`.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** borrado lógico (`status='archived'`) sin políticas DELETE — lo define el diccionario y preserva historial para futuros specs (resúmenes, posts).
- **Sí:** helper `current_user_role()` security definer — mismo patrón que `current_daycare_id()` (SPEC 08), evita recursión RLS contra `users`.
- **Sí:** RLS de `children` solo staff/admin; el acceso de padres (solo sus hijos) llegará con `parent_children`, no se anticipa una política permisiva.
- **Sí:** catálogo cerrado de alergias en inglés con traducción ES en UI — sigue la nota del diccionario; el texto libre generaba tags inconsistentes.
- **Sí:** avatar y edad derivados en el front (hash estable del UUID para la paleta) — la DB no los guarda; `deriveAvatar` ya existe.
- **Sí:** `enrolled_at`/`photo_consent` con defaults en DB sin campos nuevos en el diálogo — mantienen el alcance acotado; su UI irá con el spec de edición avanzada/fotos.
- **Sí:** salas por seed con UUIDs fijos (patrón SPEC 07/08), sin CRUD de salas en UI.
- **Sí:** orden de salas `created_at, name` — el seed en una sola transacción comparte `created_at`; el desempate por nombre es determinista.
- **No:** estado local optimista en `kids-view` — se reemplaza por revalidación del server component tras cada action (menos código, siempre consistente).
- **No:** reactivar archivados ni vista de archivados — fuera de alcance explícito.

## Riesgos

| Riesgo                                                       | Mitigación                                                                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Políticas con subselect a `rooms` dentro de `children`       | Se verifican con MCP usando el login staff real (SPEC 09) y una consulta con rol `parent`; los helpers security definer evitan recursión. |
| El feed depende de los mocks de `children`                   | Se mueven a `lib/data/mock-children.ts` en el paso 5 (antes de reescribir nada) y se prueba `/` de inmediato.                             |
| `allergy_tags text[]` con supabase-js (tipado/serialización) | Consulta Context7 del paso 1; el mapper centraliza la conversión en `lib/child-utils.ts`.                                                 |

## Lo que NO está en este spec

- `parent_children`, `invitations` y vinculación real de tutores.
- Feed real (`posts`, `post_children`, etiquetas de niños).
- CRUD de salas desde la UI, fotos de niños (Storage), reactivación de archivados.
- Acceso de padres a la pantalla `/kids`.
