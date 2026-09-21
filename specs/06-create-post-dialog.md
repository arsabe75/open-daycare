# SPEC 06 — Diálogo "Nueva publicación"

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-21
> **Objetivo:** Implementar el modal de `references/pantallas/crear-publicacion.dc.html` al presionar "+ Nueva publicación" (sidebar, todas las páginas) o el Composer (home), con selección de niño/sala, 7 tipos, validación inline y alta del post en el feed en memoria.

## Alcance

**Dentro:**

- `lib/data/posts.ts`: extender `PostType` a 7 — `"food" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement"` (mocks existentes sin cambios).
- `lib/post-types.ts` (nuevo): metadata compartida por tipo — `label` visible (COMIDA, SIESTA, ACTIVIDAD, LOGRO, ÁNIMO, FOTO, ANUNCIO), color `accent` y fondo `pastel`: food `#9A7B1E`/`#F1E5C4`, nap `#7B5FC0`/`#E7DCF6`, activity `#2E89A6`/`#C7E7F1`, achievement `#3E9B6C`/`#CFEBD8`, mood `#C56486`/`#F9D2DE`, photo `#D9684A`/`#FBD8CC`, announcement `#4E72C8`/`#CCD8F4`.
- `lib/post-utils.ts` (nuevo): `buildPost({ type, children, text })` puro — id único; `children` es `Child[] | "classroom"`; `childName` = nombre(s) de pila separados por ", " (omitido si es "Toda la sala"); `audience` = "familia de {pila}" | "familias de {pila1, pila2…}" | "toda la sala"; `time` = HH:MM actual, `authorNote` = "publicado por vos", `likes: 0`, `comments: 0`, sin `photoLabel`.
- `components/feed/new-post-dialog.tsx` (nuevo, client): backdrop oscuro + tarjeta centrada (máx. 580px, `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra), cabecera Cancelar (`#94887B`) / "Nueva publicación" (Fredoka) / Publicar (coral `#D9583C`); sección PARA con píldoras de los 8 niños de `lib/data/children.ts` (avatar con inicial y colores del `child.avatar`, nombre de pila; selección múltiple; seleccionada: borde/fondo `#3F362E`, texto blanco; sin seleccionar: borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`) + píldora "Toda la sala" (excluyente: al seleccionarla se deseleccionan todos los niños y viceversa); sección TIPO con las 7 píldoras (seleccionada: fondo sólido accent + texto blanco; sin seleccionar: fondo pastel + texto accent), "Comida" preseleccionado; DESCRIPCIÓN textarea (placeholder "Contá cómo le fue hoy…", vacío al abrir); FOTOS decorativa (miniatura 96px + botón "Agregar" sin acción). Estilos idénticos a la plantilla.
- Validación al presionar "Publicar": errores inline en coral (`#D9583C`) — PARA sin selección y DESCRIPCIÓN vacía/solo espacios; si es válida, `buildPost` → `onPublish(post)`, se cierra el diálogo y se limpia el formulario (selecciones, texto, errores).
- Cierre sin guardar: "Cancelar", tecla ESC y click en el backdrop; también resetea el formulario.
- `components/sidebar.tsx`: pasa a client component; prop opcional `onNewPost?: () => void`; el Link a `/crear-publicacion` se reemplaza por un `<button>` con el mismo estilo que invoca `onNewPost`.
- `components/feed/composer.tsx`: pasa a client component; de Link a `<button onClick>` con prop `onClick` (mismos estilos).
- `components/feed/home-view.tsx` (nuevo, client): recibe `initialPosts`; state `useState<Post[]>` y `dialogOpen`; renderiza Sidebar (`onNewPost`), encabezado estático, Composer (abre el diálogo), separador "PUBLICADO HOY", lista de `PostCard` y `NewPostDialog`; `onPublish` **prepende** el post a la lista.
- `components/sidebar-with-dialog.tsx` (nuevo, client): Sidebar + `NewPostDialog` con estado propio; al publicar solo cierra el diálogo (no hay feed que actualizar). Se usa en `/kids` y `/kids/[id]`.
- `components/feed/post-card.tsx`: `typeConfig` se reemplaza por `POST_TYPE_META` (7 tipos); avatar megáfono cuando el post no tiene `childName`; título: announcement → "Anuncio general", sin `childName` y otro tipo → "Toda la sala".
- `app/page.tsx`: server component que renderiza `<HomeView initialPosts={posts} />`.
- `app/kids/page.tsx` y `app/kids/[id]/page.tsx`: usan `SidebarWithDialog` en lugar de `Sidebar`.

**Fuera de alcance (para specs futuros):**

- Persistencia (localStorage, DB, API): el post vive solo en memoria hasta recargar; lo publicado desde `/kids` se descarta.
- Subida real de fotos (sección FOTOS decorativa) y `photoLabel` en posts nuevos.
- Ruta `/crear-publicacion` (los links restantes —"Editar" de `PostCard`— siguen apuntando ahí, 404).
- Edición/eliminación de posts, likes y comentarios funcionales.
- Versión móvil / responsive.

## Modelo de datos

```ts
// lib/data/posts.ts (cambio)
export type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

// lib/post-types.ts (nuevo)
export interface PostTypeMeta {
  label: string;
  accent: string;
  pastel: string;
}
export const POST_TYPE_META: Record<PostType, PostTypeMeta>;
export const POST_TYPE_ORDER: PostType[]; // orden de la plantilla

// lib/post-utils.ts (nuevo)
export function buildPost(input: {
  type: PostType;
  children: Child[] | "classroom";
  text: string;
}): Post;
```

`Post` y `Child` no cambian de forma. El estado de la lista vive en `home-view.tsx` (`useState<Post[]>` inicializado con los 3 mocks).

## Plan de implementación

1. Leer `node_modules/next/dist/docs/` (client components, eventos, composición server/client).
2. Extender `PostType` y crear `lib/post-types.ts` + `lib/post-utils.ts`.
3. Crear `new-post-dialog.tsx` (píldoras PARA/TIPO, textarea, fotos decorativas, validación inline, Cancelar/ESC/backdrop, `onPublish`).
4. Convertir `sidebar.tsx` y `composer.tsx` en client components con props de callback.
5. Actualizar `post-card.tsx` (7 tipos, avatar/título general).
6. Crear `home-view.tsx` y `sidebar-with-dialog.tsx`; actualizar `app/page.tsx`, `app/kids/page.tsx` y `app/kids/[id]/page.tsx`.
7. Verificación manual: `npm run dev` + Playwright MCP (capturas en `.playwright-mcp/`), comparar el modal contra la plantilla; probar alta válida (niño y "Toda la sala"), errores inline, tipos nuevos en el badge, disparo desde sidebar en `/kids` y desde el Composer, Cancelar/ESC/backdrop, recarga.
8. Verificación final: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [x] En `/`, el botón "+ Nueva publicación" del sidebar y el Composer abren el modal (ya no navegan a `/crear-publicacion`), visualmente idéntico a `references/pantallas/crear-publicacion.dc.html` en desktop.
- [x] En `/kids` y `/kids/[id]`, el botón del sidebar abre el mismo modal; publicar solo lo cierra.
- [x] PARA lista los 8 niños de `lib/data/children.ts` (nombre de pila + avatar real) y "Toda la sala"; permite seleccionar varios niños; "Toda la sala" es excluyente y deselecciona a todos los niños.
- [x] TIPO muestra 7 píldoras con "Comida" preseleccionado; seleccionada = sólido accent + texto blanco.
- [x] "Publicar" sin niño/sala elegido o con descripción vacía muestra errores inline en coral y no agrega ni cierra.
- [x] "Publicar" válido prepende el post en el feed de `/` con tipo/badge correctos, hora actual, "publicado por vos", likes 0 y comments 0; con "Toda la sala" muestra megáfono y "Para: toda la sala"; con varios niños muestra "Para: familias de X, Y…" y los nombres de pila en el título.
- [x] Los 3 posts mock siguen renderizándose idénticos (badges LOGRO/ACTIVIDAD/ANUNCIO, "Anuncio general").
- [x] El modal se cierra sin guardar con "Cancelar", ESC y backdrop, y reabrirlo muestra el formulario limpio.
- [x] El estado es solo en memoria: al recargar `/` vuelven los 3 posts mock.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** modal único disparado desde sidebar (todas las páginas) y Composer; fuera de `/` la publicación se descarta (estado por página, consistente con SPEC 04/05).
- **Sí:** `home-view.tsx` como padre client que une sidebar, composer, lista y diálogo; en `/kids` se usa `sidebar-with-dialog.tsx` porque las páginas server no pueden pasar callbacks.
- **Sí:** extender `PostType` a 7 con metadata centralizada en `lib/post-types.ts` (la usan píldoras del modal y badges de `PostCard`); pastel de food derivado (`#F1E5C4`, la plantilla solo muestra el sólido).
- **Sí:** PARA deriva de `children.ts` (8 niños, nombre de pila); se descartan los 3 hardcodeados de la plantilla porque son datos de ejemplo.
- **Sí:** validación PARA + DESCRIPCIÓN con errores inline al publicar, botón siempre clickeable y "Comida" preseleccionado (patrón SPEC 04/05).
- **Sí:** textarea vacío al abrir; el texto precargado de la plantilla es contenido de ejemplo.
- **No:** subida de fotos real; sin persistencia no aporta valor y exigiría cambiar `PostCard`.
- **Sí:** selección múltiple en PARA; "Toda la sala" es excluyente (deselecta niños). Un niño → `audience` "familia de X"; varios niños → "familias de X, Y…" y `childName` con los nombres separados por ", ".
- **No:** ruta `/crear-publicacion`; el modal la reemplaza y "Editar" queda como link futuro.

## Riesgos

- Convertir `sidebar.tsx` en client component afecta a todas las páginas; riesgo bajo de hidratación, verificar `/`, `/kids` y `/kids/[id]` contra el estado actual.
- Posts publicados desde `/kids` se descartan al no haber feed visible; puede sorprender en la demo — decisión explícita.
- El post nuevo se pierde al recargar (sin persistencia); consistente con specs anteriores.
