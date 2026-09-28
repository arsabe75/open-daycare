# SPEC 11 — Invitación real de padres: correo vía Resend y activación con código

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (diálogo "Vincular padre"), SPEC 08 (`users` + trigger `handle_new_user`), SPEC 09 (auth real y proxy), SPEC 10 (`rooms`/`children`, `current_user_role()`)
> **Fecha:** 2026-09-28
> **Objetivo:** Persistir las invitaciones de tutores en `invitations`, enviarles un correo con código usando el paquete `resend` desde el server de Next.js, y registrar/activar la cuenta del padre en `/activate-account` con ese código creando el vínculo en `parent_children`.

## Alcance

**Dentro:**

- `supabase/migrations/<timestamp>_create_invitations_parent_children.sql` (generado con `npx supabase migration new create_invitations_parent_children`):
  - **Enums:** `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) y `public.relationship_type` (`father`, `mother`, `guardian`), según diccionario.
  - **Tabla `public.invitations`** según diccionario: `id uuid PK default gen_random_uuid()`, `child_id uuid not null references children on delete cascade`, `invited_by uuid not null references users on delete restrict`, `full_name text not null`, `email text not null`, `relationship relationship_type not null`, `code text not null unique`, `status invitation_status not null default 'pending'`, `expires_at timestamptz not null`, `accepted_at timestamptz` nullable, `created_at timestamptz not null default now()`. Índice `invitations_child_id_idx`. RLS activado.
  - **Tabla `public.parent_children`** según diccionario: `id uuid PK default gen_random_uuid()`, `parent_id uuid not null references users on delete cascade`, `child_id uuid not null references children on delete cascade`, `relationship relationship_type not null`, `created_at timestamptz not null default now()`, `unique (parent_id, child_id)`. Índices `parent_children_parent_id_idx` y `parent_children_child_id_idx`. RLS activado.
  - **Extensión del trigger `handle_new_user()`** (SPEC 08): si `raw_user_meta_data->>'invitation_id'` viene presente, valida en la misma transacción que la invitación exista, esté `pending`, no esté vencida (`expires_at > now()`) y que `invitation.email = new.email`; entonces la marca `accepted` con `accepted_at = now()` e inserta la fila de `parent_children` (`parent_id = new.id`, `child_id` y `relationship` de la invitación). Si la validación falla, `raise exception` → el signup completo se revierte. Sin `invitation_id` en metadata (staff creado por CLI/dashboard) el comportamiento actual no cambia.
  - **Función `public.invitation_by_code(code text)`:** `security definer`, `stable`, `set search_path = public`; devuelve una sola fila con `child_full_name`, `room_name`, `daycare_id`, `full_name`, `email`, `relationship`, `status`, `expires_at` (o nada si no existe). `grant execute` a `anon` y `authenticated` (la pantalla de activación se consulta sin sesión).
  - **Políticas RLS:**
    - `invitations_select_staff`, `invitations_insert_staff`: `current_user_role() in ('staff','admin')` y el niño del `child_id` pertenece al daycare propio (`exists` sobre `rooms`/`children` con `current_daycare_id()`).
    - `invitations_cancel_staff`: UPDATE solo para staff/admin del daycare propio, `using (status = 'pending')` y `with check (status = 'cancelled')` (el paso a `accepted` lo hace el trigger, que es security definer).
    - `parent_children_select_staff`: staff/admin del daycare propio; `parent_children_select_own`: `parent_id = auth.uid()` (para el futuro feed del padre). Sin políticas INSERT/UPDATE/DELETE: solo escribe el trigger.
  - `comment on table/column` breves en inglés.
- Aplicar con `npx supabase db push`; verificación MCP (estructura, RLS anónima → 0 filas, `invitation_by_code` ejecutable por anon, `get_advisors` sin avisos nuevos).
- **Configuración del proyecto Supabase (paso manual documentado):** desactivar "Confirm email" en Auth → Sign In / Up, para que el `signUp` quede confirmado y con sesión (el correo de Resend con el código es nuestra verificación).
- **Resend:** `npm i resend`; variable `RESEND_API_KEY` en `.env` y `.env.template` (el proyecto usa `.env`, no `.env.local` como dice AGENTS.md). El cliente `new Resend(...)` y el envío viven solo en código server (`lib/`), nunca en client components.
- **Capa de datos Next.js:**
  - `lib/child-types.ts`: agrega `DbRelationship` (`"father" | "mother" | "guardian"`) e `InvitationInfo` (resultado de `invitation_by_code`).
  - `lib/parent-utils.ts`: mapeos `toDbRelationship(relation: ParentRelation)` y `relationLabelFromDb(rel: DbRelationship)` (`mother`→Mamá, `father`→Papá, `guardian`→Tutor/a); se conserva `generateInviteCode()` y `isValidEmail()`.
  - `lib/emails/invitation-email.ts` (nuevo): `buildInvitationEmailHtml({ parentName, childFirstName, code, activateUrl })` → HTML con la paleta de la app (fondo `#FBF4EC`, tarjeta blanca, código en grande, botón coral con el link de activación y nota "Vence en 7 días"). Sin librerías de plantillas.
  - `lib/data/children.ts`: `getActiveChildrenWithRoom()` y `getActiveChildById()` cargan también `linkedParents` reales — filas de `parent_children` join `users` (ACTIVA) más `invitations` del niño `status='pending'` y `expires_at > now()` (PENDIENTE) — y el mapper de `lib/child-utils.ts` las convierte al view-model `LinkedParent` (avatar con `deriveAvatar`, color `#FFFFFF` para coherencia con SPEC 05).
- **Server actions:**
  - `lib/actions/invitations.ts` (`"use server"`): `createInvitation(prevState, formData)` — valida servidor (nombre, email válido, parentesco, niño del daycare propio); cancela (`status='cancelled'`) cualquier invitación `pending` previa del mismo niño+email; inserta la invitación con el código candidato que envía el diálogo (si viola el unique, reintenta hasta 3 veces con código nuevo generado server); envía el correo con Resend usando como origen la URL de `headers()` (`${origin}/activate-account?code=…`); si el envío falla marca la invitación `cancelled` y devuelve `{ error }`; en éxito `revalidatePath('/kids/[id]')` y `{ ok: true }`.
  - `lib/actions/activation.ts` (`"use server"`): `activateAccount(prevState, formData)` — consulta `invitation_by_code`, valida `pending`, no vencida y email idéntico al de la invitación; valida contraseña (mínimo 6, mapeando el error de Supabase a español); `supabase.auth.signUp({ email, password, options: { data: { daycare_id, role: 'parent', full_name, invitation_id } } })` con el cliente server de `utils/supabase/server`; en éxito `revalidatePath('/', 'layout')` + `redirect('/')` (sesión creada automáticamente); en fallo devuelve `{ error }` sin navegar.
- **UI diálogo (`components/kids/profile/link-parent-dialog.tsx`):** el submit pasa a ser un `<form>` con `useActionState` contra `createInvitation`; se conserva el código candidato visible generado al abrir (fidelidad a la plantilla de SPEC 05) y se envía como campo oculto; en éxito cierra y limpia (la lista se refresca por revalidación); en error muestra mensaje inline en coral (envío fallido, email ya vinculado activo al niño).
- **UI tutores (`components/kids/profile/linked-parents.tsx`):** sigue siendo client component pero sin estado de lista: renderiza `child.linkedParents` que viene del server (persiste al recargar); solo conserva `isDialogOpen`. Caen `buildLinkedParent` y el alta en memoria.
- **UI activación:**
  - `app/activate-account/page.tsx` (server component): lee `searchParams.code`; con código válido renderiza el formulario con la invitación precargada (tarjeta "Te invitaron a seguir a {niño} · {sala}" con datos reales, email read-only, código precargado); con código inválido/vencido muestra mensaje de error en lugar de la tarjeta; sin código, formulario con código editable y sin tarjeta.
  - `components/auth/activate-form.tsx` (nuevo, client): campos CÓDIGO (editable, precargado si hay param), EMAIL (read-only cuando la invitación está cargada), CREAR CONTRASEÑA y checkbox de fotos **solo UI**; al tener 5 caracteres consulta `invitation_by_code` con el cliente browser de `utils/supabase/client` para mostrar/ocultar la tarjeta de invitación; submit con `useActionState` contra `activateAccount` y errores inline; reutiliza `AuthField`/`AuthSubmit` (este último como botón, patrón SPEC 09).
- `proxy.ts` sin cambios: `/activate-account` ya es ruta pública y con sesión redirige a `/`.

**Fuera de alcance (para specs futuros):**

- Feed real del padre (el home sigue con mocks de `lib/data/mock-children.ts`) y cualquier UI diferenciada por rol (ocultar `/kids` a padres, etc.).
- UI de gestión de invitaciones: listado, reenvío manual, cancelación manual desde el perfil.
- Job/cron que pase invitaciones vencidas a `status='expired'` (hoy se resuelve comparando `expires_at` al validar).
- Persistir el consentimiento de fotos del checkbox de activación.
- Forgot password, OAuth, MFA.
- Avatares/fotos reales (Storage).
- Versión móvil / responsive.

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_invitations_parent_children.sql (esqueleto)
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.relationship_type as enum ('father', 'mother', 'guardian');

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id) on delete cascade,
  invited_by   uuid not null references public.users (id) on delete restrict,
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id) on delete cascade,
  child_id     uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

-- handle_new_user(): si raw_user_meta_data->>'invitation_id' existe,
-- valida (pending, expires_at > now(), email = new.email), marca accepted
-- e inserta parent_children; si no cumple, raise exception (revierte el signup).

-- invitation_by_code(code text): security definer, grant execute a anon/authenticated.
-- RLS: invitations select/insert/cancel solo staff-admin del daycare;
-- parent_children select staff del daycare o parent_id = auth.uid(); sin writes por política.
```

```ts
// lib/child-types.ts (agregados)
export type DbRelationship = "father" | "mother" | "guardian";

export interface InvitationInfo {
  childFullName: string; // children.full_name
  roomName: string; // rooms.name
  daycareId: string; // daycare del niño (para el metadata del signUp)
  fullName: string; // nombre del padre/tutor invitado
  email: string; // email invitado (read-only en el form)
  relationship: DbRelationship;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string; // ISO
}
```

Convenciones:

- El view-model `LinkedParent` no cambia de forma; `relation` sigue siendo `ParentRelation` (`mom`/`dad`/`guardian`) y el mapeo al enum de DB vive en `lib/parent-utils.ts`.
- `expires_at = now() + interval '7 days'` al insertar; el texto "Vence en 7 días" del diálogo sigue fijo.
- Labels UI en español (`Mamá`/`Papá`/`Tutor/a`, badges `ACTIVA`/`PENDIENTE`): solo en componentes, nunca en DB.

## Plan de implementación

1. Cargar la skill `/supabase-postgres-best-practices`; consultar Context7 por el uso server-side del paquete `resend` en Next.js y por `signUp` con `options.data` (metadata) en `@supabase/ssr`.
2. `npx supabase migration new create_invitations_parent_children` y escribir el SQL completo (enums, tablas, índices, extensión de `handle_new_user`, `invitation_by_code` con grants, políticas RLS, comments).
3. `npx supabase db push`; verificación MCP: estructura de ambas tablas, consulta anónima → 0 filas, `invitation_by_code` ejecutable por anon, `get_advisors` sin avisos nuevos.
4. Desactivar "Confirm email" en el proyecto Supabase (Auth → Sign In / Up) y verificar con un signup de prueba que el usuario queda `email_confirmed_at` lleno.
5. `npm i resend`; agregar `RESEND_API_KEY` a `.env` y `.env.template`.
6. Crear los agregados de `lib/child-types.ts`, los mapeos en `lib/parent-utils.ts` y `lib/emails/invitation-email.ts`.
7. Crear `lib/actions/invitations.ts` con `createInvitation` (validación, cancelación de pending previa, insert con reintento de código, envío Resend, cancelación si el envío falla, `revalidatePath`).
8. Conectar `link-parent-dialog.tsx` a la action (`useActionState`, cierre en éxito, error inline); quitar el alta en memoria de `linked-parents.tsx` (lista desde props). Prueba manual: invitar deja la fila `pending` en DB y la fila PENDIENTE sobrevive recargar.
9. Prueba de correo: con `RESEND_API_KEY` válida el correo llega con código y link; sin key, el diálogo muestra error inline y la invitación queda `cancelled`.
10. Crear `lib/actions/activation.ts` con `activateAccount` (validación de invitación, `signUp` con metadata, redirect a `/`).
11. Reescribir `app/activate-account/page.tsx` (searchParams, tarjeta real, estados de código inválido/vencido) y crear `components/auth/activate-form.tsx` (lookup por código con cliente browser, email read-only, `useActionState`).
12. Prueba manual de activación: usuario `parent` confirmado en Auth, perfil en `public.users`, invitación `accepted` con `accepted_at`, fila en `parent_children`, sesión activa en `/`; logout + login con las credenciales nuevas funciona.
13. Cargar `linkedParents` reales en `lib/data/children.ts` + mapper en `lib/child-utils.ts`; verificar que el perfil muestra ACTIVA/PENDIENTE desde DB y que el badge VINCULAR de `child-card.tsx` desaparece al haber tutores.
14. Verificación manual completa con Playwright (capturas en `.playwright-mcp/`): staff invita → correo → `/activate-account?code=…` → activación → perfil del niño con el tutor ACTIVA → códigos inválidos/vencidos muestran error.
15. `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Criterios de aceptación

- [ ] La migración `create_invitations_parent_children` existe en `supabase/migrations/` y en el historial remoto con los enums `invitation_status` y `relationship_type`, las tablas `invitations` y `parent_children` del diccionario (unique en `code`, unique `(parent_id, child_id)`, índices por FK) y RLS activado en ambas.
- [ ] Una consulta anónima a `invitations` y `parent_children` devuelve 0 filas; `invitation_by_code` es ejecutable por anon y solo expone los campos de `InvitationInfo`.
- [ ] "Enviar invitación" válido crea una fila `pending` con `expires_at` ≈ `now() + 7 días` y el parentesco mapeado al enum (`mom`→`mother`, `dad`→`father`), y cancela cualquier `pending` previa del mismo niño+email.
- [ ] Con `RESEND_API_KEY` configurada, el correo sale desde `onboarding@resend.dev` con el código visible y un botón a `/activate-account?code=…`; sin key configurada el diálogo muestra error inline y la invitación queda `cancelled` (sin códigos huérfanos).
- [ ] El diálogo se cierra en éxito y la sección "PADRES VINCULADOS" muestra al nuevo tutor con badge PENDIENTE y subtítulo "{Mamá|Papá|Tutor/a} · invitación enviada", persistiendo al recargar `/kids/[id]`.
- [ ] `/activate-account?code=<código pending>` muestra la tarjeta con el niño y sala reales, el email read-only precargado y el código precargado; con código inexistente, aceptado, cancelado o vencido muestra un mensaje de error claro en lugar de la tarjeta.
- [ ] Activar con contraseña válida crea el usuario confirmado en Supabase Auth, su perfil en `public.users` (`role='parent'`, `full_name` de la invitación, `daycare_id` del niño), marca la invitación `accepted` con `accepted_at` e inserta el vínculo en `parent_children` con el parentesco correcto.
- [ ] Tras activar, la sesión queda creada y se redirige a `/`; el padre puede hacer logout y volver a entrar con su email y contraseña.
- [ ] Activar con código vencido, código de otro email o contraseña corta falla con error inline y no crea usuario ni invitación aceptada (el signup se revierte completo).
- [ ] El perfil `/kids/[id]` muestra al padre activado con badge ACTIVA y parentesco en español; el badge VINCULAR de la card en `/kids` desaparece cuando el niño tiene tutores vinculados.
- [ ] El checkbox de autorización de fotos de `/activate-account` no escribe nada en la base de datos.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** envío del correo desde el server de Next.js (server action con el paquete `resend`) — la API key nunca llega al browser y el proyecto ya centraliza mutaciones en `lib/actions/`.
- **Sí:** desactivar "Confirm email" en Supabase — el correo de Resend con el código es la verificación de intención; mantenerlo duplicaría correos y dejaría usuarios sin confirmar que no pueden entrar.
- **Sí:** aceptar la invitación dentro del trigger `handle_new_user` (misma transacción que el signup) — atomicidad: si el vínculo falla, el usuario no queda huérfano; se descarta un `rpc accept_invitation` post-signUp que dejaría usuario sin vínculo si fallara.
- **Sí:** email read-only precargado en la activación — impide activar una invitación ajena con otro email; el server además compara `invitation.email = new.email` en el trigger.
- **Sí:** login automático tras activar (con confirm email desactivado el `signUp` devuelve sesión) y `redirect('/')` — menos fricción; el feed del padre real queda para su propio spec.
- **Sí:** código candidato generado en el diálogo (fidelidad a la plantilla de SPEC 05) que el server usa si está libre y reemplaza con reintento si colisiona (unique en `code`) — el código que vale es siempre el persistido y enviado por correo.
- **Sí:** fallo de envío Resend → invitación `cancelled` + error inline — no quedan códigos vivos que nadie recibió; el staff reintenta y se crea una invitación nueva.
- **Sí:** re-invitación del mismo niño+email cancela la `pending` previa — evita dos códigos vivos para el mismo vínculo; un email ya vinculado activo al niño es error inline siempre.
- **Sí:** vencimiento por comparación de `expires_at` al validar; el status `expired` y un cron de limpieza quedan reservados para un spec futuro.
- **Sí:** checkbox de fotos solo UI — el diccionario no tiene columna de consentimiento del padre (`photo_consent` vive en `children` y lo gestiona el staff).
- **Sí:** `RESEND_API_KEY` en `.env` y `.env.template` — el proyecto ya usa `.env` (no `.env.local` como dice AGENTS.md); se mantiene la convención existente.
- **Sí:** origen del link del correo tomado de `headers()` en la server action — en dev apunta a localhost y en producción al dominio real sin agregar variables de entorno.
- **No:** librerías de plantillas de email (react-email, etc.) — un builder de HTML en `lib/emails/invitation-email.ts` alcanza y suma cero dependencias.
- **No:** UI de gestión de invitaciones (listado, reenvío, cancelación manual) y feed/UI por rol del padre — specs separados cuando la vinculación esté estable.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código de 5 caracteres enumerable vía `invitation_by_code` (anon)                     | La función solo responde con código exacto (~33M combinaciones) y datos de baja sensibilidad; activar exige además email idéntico y contraseña; el rate limiting de Supabase frena el brute force. |
| Trigger `handle_new_user` con dos caminos (staff sin metadata / padre con invitación) | La rama de invitación solo corre si `invitation_id` está en metadata; el paso 12 prueba ambos caminos (signup staff por CLI y activación por invitación).                                          |
| Sin `RESEND_API_KEY` en dev el envío siempre falla                                    | El camino degradado es parte de los criterios (error inline + invitación `cancelled`); el envío real se verifica al configurar la key.                                                             |
| `signUp` dentro de una server action debe dejar las cookies `sb-*` escritas           | Patrón soportado por `@supabase/ssr` en server actions (el cookieStore es mutable); si fallara, fallback documentado: redirigir a `/login` tras activar en vez de auto-login.                      |
| Carrera entre validar la invitación y el `signUp` (vencimiento en el medio)           | El trigger re-valida dentro de la transacción y hace `raise exception`: el signup se revierte completo y el form muestra error.                                                                    |

## Lo que NO está en este spec

- Feed real del padre y UI diferenciada por rol.
- UI de gestión de invitaciones (listado, reenvío, cancelación manual) y cron de `expired`.
- Persistencia del consentimiento de fotos, avatares/fotos en Storage.
- Forgot password, OAuth y MFA.
- Versión móvil / responsive.

Cada uno de esos, si llega, va en su propio spec.
