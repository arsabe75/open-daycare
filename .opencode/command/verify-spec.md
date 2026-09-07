---
description: Verifica, corrige y marca los Acceptance criteria del spec indicado usando el agente spec-verifier.
agent: spec-verifier
---

Verifica el spec `$ARGUMENTS` siguiendo tu flujo de trabajo:

1. Si `$ARGUMENTS` está vacío o el archivo no existe, pregunta al usuario cuál spec desea verificar o usa el más reciente de `specs/`.
2. Lee el spec, extrae los criterios de aceptación y verifica cada uno con evidencia real.
3. Usa Context7 para validar recomendaciones de Next.js 16 y Playwright MCP con visión para comparar pantallas contra `references/pantallas/*.dc.html` y `references/screenshots/`.
4. Corrige lo que falle y re-ejecuta `npm run lint`, `npx tsc --noEmit` y `npm run build`.
5. Marca `- [ ]` como `- [x]` solo en los criterios verificados; deja notas breves debajo de los fallidos.
6. Entrega un resumen final: total de criterios, verificados, corregidos y pendientes.
