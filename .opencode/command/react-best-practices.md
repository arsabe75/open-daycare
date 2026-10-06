---
description: Aplica las mejores prácticas de React a los archivos indicados usando el agente react-best-practices.
agent: react-best-practices
---

Aplica las mejores prácticas de React a `$ARGUMENTS` siguiendo tu flujo de trabajo:

1. Si `$ARGUMENTS` está vacío, pregunta al usuario qué archivos desea revisar.
2. Analiza cada archivo e identifica oportunidades de mejora (hooks, Server/Client Components, estado, rendimiento, patrones deprecados).
3. Verifica cada recomendación con Context7 antes de aplicarla.
4. Edita los archivos conservando el comportamiento funcional.
5. Valida con `npm run lint` y `npx tsc --noEmit`.
6. Entrega el resumen final: cambios aplicados con su fuente documental y hallazgos no modificados.
