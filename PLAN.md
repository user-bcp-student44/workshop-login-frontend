# PLAN de corrección de items pendientes (sin cambios de código todavía)

## Contrato a preservar

Este plan no cambia los contratos de [docs/ENDPOINTS.md](C:/Users/Usuario/Documents/t08267-christian-lopez/reqflow-workspace/workshop-login-frontend/docs/ENDPOINTS.md):

- `POST /auth/login`
- `GET /api/tasks`
- Flujo funcional: login -> guardar sesión -> consultar tareas -> cerrar sesión.

---

## Item: H-03 — Dependencias vulnerables/deuda técnica (`axios 0.31.0`, `lodash 4.17.21`)

### Cambio propuesto
1. Levantar evidencia de seguridad de versiones actuales (`npm audit` y changelogs).
2. Actualizar dependencias a versiones sin CVEs conocidos, priorizando compatibilidad con Angular actual.
3. Validar que no cambie el comportamiento de:
   - `AuthService.login(...)`
   - `TasksService.getTasks(...)`
   - carga de preferencias (actualmente en `SessionService` sin `lodash`).
4. Si `lodash` ya no es necesario, remover su uso residual y dependencia para reducir superficie.

### Archivos a tocar
- `package.json`
- `package-lock.json` (si aplica por instalación/actualización)
- `src/app/**` (solo si hay ajustes de compatibilidad por API de librería)
- `docs/TESTING.md` (actualizar evidencia de validación)
- `HALLAZGOS.md` (cambiar estado al resolver)

### Prueba a escribir antes de tocarlo
- Prueba de caracterización de contratos HTTP en servicios:
  - `AuthService` mantiene request a `/auth/login` con `username`, `password`, `client`.
  - `TasksService` mantiene request a `/api/tasks?owner=...` con header `Authorization`.
- Prueba de no regresión de flujo:
  - Login exitoso navega a dashboard.
  - Dashboard con token consulta tareas.

---

## Item: H-05 — Uso de `any`, anidamiento y duplicación de manejo de sesión

### Cambio propuesto
1. Revalidar y completar tipado estricto donde aún quede `any` en componentes/utilidades.
2. Reducir ramas condicionales complejas aplicando retornos anticipados y funciones pequeñas.
3. Eliminar duplicación residual relacionada a sesión (lectura/limpieza/validación) manteniendo a `SessionService` como único punto.
4. Alinear nombres y contratos internos con [docs/GOOD_PRACTICES.md](C:/Users/Usuario/Documents/t08267-christian-lopez/reqflow-workspace/workshop-login-frontend/docs/GOOD_PRACTICES.md).

### Archivos a tocar
- `src/app/login/login.component.ts`
- `src/app/dashboard/dashboard.component.ts`
- `src/app/services/session.service.ts` (solo si se detecta lógica duplicada residual)
- `src/app/utils/legacy-format.ts` (si requiere tipado de entrada/salida)
- `src/app/models/*.ts` (si faltan tipos para eliminar `any`)
- `src/app/login/login.component.spec.ts`
- `src/app/dashboard/dashboard.component.spec.ts`

### Prueba a escribir antes de tocarlo
- Pruebas de caracterización de comportamiento actual:
  1. Validaciones de login (usuario/contraseña vacíos).
  2. Respuesta sin token en login.
  3. Dashboard sin token redirige a login.
  4. Logout limpia sesión y navega a login.
- Estas pruebas fijan comportamiento observable para permitir refactor interno sin cambiar UX.

---

## Item: H-06 — Cobertura limitada y pruebas de reglas de negocio

### Cambio propuesto
1. Expandir suite para cubrir reglas de negocio del flujo completo (no solo utilidades).
2. Añadir casos explícitos por categoría:
   - camino feliz,
   - casos borde,
   - errores de red/autenticación documentados en `docs/ENDPOINTS.md`.
3. Medir cobertura focalizada del código tocado y mantener meta >=85%.
4. Dejar trazabilidad en `docs/TESTING.md` con comandos reales y resultados.

### Archivos a tocar
- `src/app/login/login.component.spec.ts`
- `src/app/dashboard/dashboard.component.spec.ts`
- `src/app/services/auth.service.spec.ts`
- `src/app/services/tasks.service.spec.ts`
- `src/app/services/session.service.spec.ts`
- `docs/TESTING.md`
- `HALLAZGOS.md` (cambiar estado al resolver)

### Prueba a escribir antes de tocarlo
- Prueba de caracterización de línea base:
  - Ejecutar `npm test`.
  - Ejecutar cobertura focalizada sobre login/dashboard/services.
  - Registrar baseline en `docs/TESTING.md` antes de agregar nuevos casos.

---

## Orden sugerido de ejecución

1. **H-03** (riesgo de seguridad por dependencias).
2. **H-05** (calidad interna y mantenibilidad).
3. **H-06** (consolidación de cobertura y evidencia final).
