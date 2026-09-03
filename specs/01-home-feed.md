# SPEC 01 — Home con plantilla de feed

> **Estado:** Borrador
> **Depende de:** —
> **Fecha:** 2026-09-03
> **Objetivo:** Implementar la plantilla `references/pantallas/feed.dc.html` como home (`/`) con estilo visual idéntico, usando datos mock y sin autenticación ni base de datos.

## Alcance

**Dentro:**

- Reemplazar el contenido default de `app/page.tsx` por el feed de la plantilla.
- Sidebar con logo OpenDayCare ("Sala Soles"), botón "Nueva publicación", navegación (Feed activo, Niños, Avisos, Mi cuenta) y tarjeta de usuario con botón de logout.
- Encabezado del feed ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), caja "Compartí un momento…" y separador "PUBLICADO HOY".
- Tres tarjetas de post con datos mock: LOGRO (Mateo), ACTIVIDAD con foto (Mateo), ANUNCIO general.
- Archivo de datos mock tipado `lib/data/posts.ts`.
- Tipografías Fredoka + Nunito vía `next/font/google`, reemplazando Geist en `app/layout.tsx`.
- Metadata y `lang` actualizados (título "OpenDayCare", `lang="es"`).
- Links apuntando a rutas futuras: `/crear-publicacion`, `/ninos`, `/avisos`, `/mi-cuenta`, `/login`, `/detalle-publicacion`, `/foto`.

**Fuera de alcance (para specs futuros):**

- Autenticación real y manejo de sesión.
- Base de datos, persistencia y APIs.
- Comportamiento real de botones (crear/editar publicación, likes, comentarios, logout).
- El resto de las pantallas (crear-publicación, niños, avisos, mi-cuenta, login, detalle, foto).
- Versión móvil / responsive.

## Modelo de datos

```ts
// lib/data/posts.ts
export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType; // define badge, colores y avatar
  childName?: string; // "Mateo"; ausente en anuncios
  audience: string; // "familia de Mateo" | "toda la sala"
  time: string; // "14:20"
  authorNote: string; // "publicado por vos"
  text: string;
  photoLabel?: string; // "Foto · pintando con témperas"
  likes: number;
  comments: number;
}
```

Convención: los tipos internos están en inglés; el mapeo a texto visible queda en el componente (achievement → "LOGRO", activity → "ACTIVIDAD", announcement → "ANUNCIO"). Los colores por tipo (`achievement` → `#3E9B6C`/`#CFEBD8`, `activity` → `#2E89A6`/`#C7E7F1`, `announcement` → `#4E72C8`/`#CCD8F4`) se definen como constantes junto al componente de tarjeta. Los datos son mock hardcodeado, sin persistencia.

## Plan de implementación

1. Leer la documentación incluida en `node_modules/next/dist/docs/01-app/01-getting-started/` (fonts, linking-and-navigating, layouts-and-pages, metadata) para respetar las APIs vigentes de esta versión de Next.js.
2. Configurar tipografías: reemplazar Geist por Fredoka y Nunito en `app/layout.tsx` (variables `--font-fredoka`, `--font-nunito`), actualizar metadata y `lang="es"`; ajustar `app/globals.css` (font-sans → Nunito, fondo del body `#F6ECDF`, quitar el bloque `prefers-color-scheme` oscuro).
3. Crear `lib/data/posts.ts` con los tipos y los 3 posts mock.
4. Crear `components/sidebar.tsx` (logo, botón Nueva publicación, nav con Feed activo, tarjeta de usuario con logout).
5. Crear `components/feed/composer.tsx` y `components/feed/post-card.tsx` (avatar, badge por tipo, audiencia, texto, placeholder de foto punteado, acciones likes/comentarios/editar).
6. Reescribir `app/page.tsx` componiendo sidebar + encabezado + composer + separador + lista de posts, con los mismos colores, radios, sombras y espaciados de la plantilla.
7. Verificación manual: `npm run dev`, abrir `/` en desktop y comparar visualmente contra `references/pantallas/feed.dc.html`; comprobar que los links apunten a las rutas futuras.

## Criterios de aceptación

- [ ] `/` renderiza el feed completo sin errores en consola.
- [ ] El resultado visual es idéntico a `references/pantallas/feed.dc.html` en desktop (colores, tipografías Fredoka/Nunito, radios, sombras, espaciados).
- [ ] El sidebar muestra logo OpenDayCare ("Sala Soles"), botón "Nueva publicación", nav con Feed activo y usuario "Caro Giménez · Maestra · Soles".
- [ ] Se muestran exactamente 3 posts con badges LOGRO, ACTIVIDAD y ANUNCIO, contadores 3/1, 5/2 y 8/0, y el post de actividad con su placeholder de foto.
- [ ] Los links apuntan a `/crear-publicacion`, `/ninos`, `/avisos`, `/mi-cuenta`, `/login`, `/detalle-publicacion` y `/foto` (aunque hoy den 404).
- [ ] Ningún botón ejecuta lógica real (sin handlers ni mutaciones).
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** datos mock tipados en `lib/data/posts.ts`. Permite reemplazar por la DB real sin tocar la UI.
- **Sí:** links a rutas futuras aunque den 404. El ruteo queda listo para los próximos specs.
- **Sí:** Fredoka + Nunito globales reemplazando Geist. Es la identidad visual de toda la app, no solo del home.
- **Sí:** componentes server-only (sin `"use client"`). No hay interactividad.
- **Sí:** tipos internos en inglés (`achievement`, `activity`, `announcement`) y copy visible en español (`LOGRO`, `ACTIVIDAD`, `ANUNCIO`). Respeta la regla de código limpio en inglés sin perder la UI en español.
- **Sí:** tema claro único; se elimina el bloque `prefers-color-scheme: dark`. La plantilla no define variante oscura.
- **No:** versión móvil. La plantilla es desktop-only; va en otro spec.
- **No:** funcionalidad real en botones. Sin DB ni auth, todo comportamiento es prematuro.

## Lo que NO está en este spec

- Autenticación, base de datos y cualquier persistencia.
- El resto de las pantallas referenciadas por los links.
- Versión móvil y modo oscuro.
