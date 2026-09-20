# SPEC 05 — Diálogo "Vincular padre"

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-09-20
> **Objetivo:** Implementar el diálogo de `references/pantallas/vincular-padre.dc.html` al presionar "Vincular otro padre" en `/kids/[id]`, con validación de nombre/email, 3 parentescos (Mamá, Papá, Tutor/a), código de invitación generado y alta del padre en estado local como PENDIENTE.

## Alcance

**Dentro:**

- `lib/data/children.ts`: extender `ParentRelation` a `"mom" | "dad" | "guardian"` (sin cambios en los mocks existentes).
- `lib/parent-utils.ts`: helpers puros — `isValidEmail()`, `generateInviteCode()` (5 caracteres alfanuméricos en mayúsculas), `buildLinkedParent(name, relation, paletteIndex)` que deriva el `LinkedParent` nuevo: id único, `status: "pending"`, avatar con inicial + paleta de `deriveAvatar` (`lib/child-utils.ts`) con `color: "#FFFFFF"` (consistente con los padres mock).
- `components/kids/profile/link-parent-dialog.tsx`: diálogo client component — backdrop oscuro, tarjeta centrada (máx. 480px, `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra), cabecera "Vincular padre" (Fredoka) + subtítulo "a {nombre de pila del niño}" + botón X de cierre, banner informativo azul (`#E3ECFB`, texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {nombre de pila}."), campos NOMBRE DEL PADRE/MADRE y EMAIL, selector PARENTESCO con 3 píldoras (seleccionada: borde `#9FB8EC`, fondo `#CCD8F4`, texto `#4E72C8`; sin seleccionar: borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`), caja amarilla de código de invitación (`#FBF1D6`, borde dashed `#E6D08A`, código en Fredoka 34px letter-spacing 7px, "Vence en 7 días") y CTA coral "Enviar invitación" con ícono de envío; estilos idénticos a la plantilla.
- `components/kids/profile/linked-parents.tsx`: pasa a client component (`"use client"`) con `useState<LinkedParent[]>` inicializado desde `child.linkedParents`; el link "Vincular otro padre" (`href="/link-parent"`) se reemplaza por un `<button>` que abre el diálogo; `relationLabel` suma `guardian → "Tutor/a"`.
- Código de invitación generado con `generateInviteCode()` cada vez que se abre el diálogo; "Vence en 7 días" es texto fijo.
- Parentesco preseleccionado: "Mamá".
- Validación al presionar "Enviar invitación": errores inline en coral (`#D9583C`) bajo cada campo — nombre vacío, email vacío o inválido (formato básico `x@y.z`); si es válida, se construye el `LinkedParent`, se agrega a la lista (aparece como fila con badge PENDIENTE y subtítulo "{parentesco} · invitación enviada"), se cierra el diálogo y se limpia el formulario.
- Cierre sin guardar: botón X, tecla ESC y click en el backdrop.
- `app/kids/[id]/page.tsx`: sin cambios (sigue siendo server component; `LinkedParents` recibe el `child` igual que hoy).

**Fuera de alcance (para specs futuros):**

- Envío real de correos y activación de cuenta con el código (el flujo de `/activate-account` de SPEC 03 no se conecta).
- Persistencia (localStorage, DB, API): el padre vinculado vive solo en memoria hasta recargar.
- Validación de email duplicado contra padres ya vinculados.
- Regenerar/revocar invitaciones pendientes, reenvío y expiración real del código.
- Ruta `/link-parent` (el link desaparece; la ruta no llega a existir).
- Edición/eliminación de padres vinculados.
- Versión móvil / responsive.

## Modelo de datos

```ts
// lib/data/children.ts (cambio)
export type ParentRelation = "mom" | "dad" | "guardian";

// lib/parent-utils.ts (nuevo)
export function isValidEmail(value: string): boolean;
export function generateInviteCode(): string; // "7K4P9"-like, 5 chars
export function buildLinkedParent(
  name: string,
  relation: ParentRelation,
  paletteIndex: number,
): LinkedParent; // status: "pending", avatar color "#FFFFFF"
```

`Child` y `LinkedParent` no cambian de forma. El estado de la lista de padres vive en `linked-parents.tsx` (`useState<LinkedParent[]>` inicializado con `child.linkedParents`).

## Plan de implementación

1. Leer `node_modules/next/dist/docs/` (client components, eventos, composición server/client).
2. Extender `ParentRelation` en `lib/data/children.ts`.
3. Crear `lib/parent-utils.ts` con validación de email, código de invitación y construcción del `LinkedParent`.
4. Crear `link-parent-dialog.tsx` (formulario, píldoras de parentesco, caja de código, validación inline, X/ESC/backdrop, `onLink`).
5. Convertir `linked-parents.tsx` en client component con estado, botón que abre el diálogo y label "Tutor/a".
6. Verificación manual: `npm run dev` + Playwright MCP (capturas en `.playwright-mcp/`), comparar el diálogo contra la plantilla en `/kids/1` (Mateo) y `/kids/7` (Valentina, sin padres); probar alta válida, errores inline, código distinto en cada apertura, X/ESC/backdrop.
7. Verificación final: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [x] En `/kids/[id]`, "Vincular otro padre" abre el diálogo (ya no navega a `/link-parent`) y este es visualmente idéntico a `references/pantallas/vincular-padre.dc.html` en desktop, con el nombre del niño real en cabecera y banner.
- [x] El selector PARENTESCO tiene 3 píldoras (Mamá preseleccionado, Papá, Tutor/a) con estilos de seleccionada/no seleccionada iguales a la plantilla.
- [x] La caja de código muestra un código de 5 caracteres generado al abrir el diálogo (distinto entre aperturas) con "Vence en 7 días" fijo.
- [x] "Enviar invitación" con nombre vacío o email vacío/inválido muestra errores inline en coral y no agrega ni cierra.
- [x] "Enviar invitación" válido agrega la fila del padre con badge PENDIENTE y subtítulo "{Mamá|Papá|Tutor/a} · invitación enviada", cierra el diálogo y limpia el formulario.
- [x] En Valentina (sin padres), vincular hace desaparecer el estado vacío y el badge VINCULAR de su tarjeta en `/kids` no cambia (estado por página, en memoria).
- [x] El diálogo se cierra sin guardar con X, ESC y click en el backdrop.
- [x] El estado es solo en memoria: al recargar `/kids/[id]` vuelven los padres mock originales.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** diálogo en memoria con validación + alta local (patrón SPEC 04); se descarta solo-UI (SPEC 03) porque la lista de padres visibles está en la misma pantalla.
- **Sí:** extender `ParentRelation` con `"guardian"`; la plantilla muestra 3 parentescos y el mapeo visible vive en los componentes (convención SPEC 02).
- **Sí:** código de invitación aleatorio por apertura (5 chars alfanuméricos); el estático `7K4P9` de la plantilla solo es un ejemplo.
- **Sí:** client wrapper limitado a `linked-parents.tsx`; se descarta un `kids-profile-view.tsx` de página completa porque el resto del perfil no necesita estado.
- **Sí:** reutilizar `deriveAvatar` de `lib/child-utils.ts` con `color: "#FFFFFF"` para el avatar del padre nuevo (los padres mock ya usan texto blanco).
- **Sí:** Mamá preseleccionado y botón siempre clickeable con errores inline al guardar (consistente con SPEC 04).
- **No:** validación de email duplicado y expiración real del código; sin backend, no aportan valor en la demo.
- **No:** conectar con `/activate-account`; el flujo de activación real va en un spec futuro con DB.

## Riesgos

- Convertir `linked-parents.tsx` en client component introduce un límite client dentro del perfil server component; riesgo bajo de hidratación, verificar visualmente contra el estado actual.
- El padre vinculado se pierde al recargar y no se refleja en la grilla de `/kids` (estado por página); puede sorprender en la demo — decisión explícita.
