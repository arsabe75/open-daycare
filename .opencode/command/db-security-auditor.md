---
description: Audita y corrige la seguridad de Supabase (RLS, fugas entre niños/padres, grants) usando el agente db-security-auditor.
agent: db-security-auditor
---

Audita la seguridad de la base de datos Supabase en `$ARGUMENTS` siguiendo tu flujo de trabajo:

1. Si `$ARGUMENTS` está vacío, realiza una auditoría completa del esquema.
2. Carga `/supabase-postgres-best-practices` antes de empezar.
3. Lee las migraciones locales y contrasta con el estado real del proyecto Supabase vinculado (tablas, RLS, funciones, security advisors).
4. Aplica el checklist de seguridad del dominio, priorizando fugas entre niños, padres, staff y guarderías.
5. Reproduce cada problema con consultas reales y documenta la evidencia.
6. Crea migraciones versionadas con `supabase migration new` y aplícalas con `supabase db push`.
7. Valida que las fugas estén cerradas tras cada corrección.
8. Entrega el resumen final con severidad, evidencia y migraciones aplicadas.
