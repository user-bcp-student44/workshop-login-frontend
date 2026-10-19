# Evidencia de ejecución de pruebas por iteración

> Este archivo registra la evidencia de pruebas ejecutadas en cada iteración de trabajo.
> Debe actualizarse en orden cronológico.

## Formato de registro

- **Iteración**: identificador corto (ej. `I-01`, `I-02`)
- **Objetivo**: hallazgo(s) o alcance de la iteración
- **Comandos ejecutados**: comandos exactos
- **Resultado**: estado (OK/FAIL) y resumen cuantitativo
- **Observaciones**: notas relevantes (errores esperados en tests, warnings de build, etc.)

---

## I-01 — Caracterización y corrección H-02/H-04

### Objetivo
Caracterizar y corregir:
- H-02 (`[innerHTML]` con contenido dinámico)
- H-04 (responsabilidades mezcladas en componentes)

### Comandos ejecutados
1. `npm test` (caracterización inicial)
2. `npm test` (después de ajustes de pruebas)
3. `npm test` (después de implementación)
4. `npm run test:coverage`
5. `npx vitest run --coverage --coverage.include=src/app/login/login.component.ts --coverage.include=src/app/dashboard/dashboard.component.ts --coverage.include=src/app/services/*.ts --coverage.include=src/environments/environment.ts`
6. `npm run build`

### Resultado
- En la caracterización inicial hubo fallo de 1 test de H-02 (riesgo XSS confirmado).
- Tras la implementación:
  - `npm test`: **6 archivos / 14 tests OK**
  - Cobertura focalizada código modificado: **91.17%**
  - `npm run build`: **OK**

### Observaciones
- Se observaron logs en `stderr` dentro de tests de error controlado (esperados por diseño de prueba).
- Build con warning de `axios` por CommonJS (no bloqueante).

---

## I-02 — Caracterización y corrección H-01

### Objetivo
Caracterizar y corregir:
- H-01 (token de sesión persistido en `localStorage`)

### Comandos ejecutados
1. `npx vitest run src/app/services/session.service.spec.ts src/app/login/login.component.spec.ts src/app/dashboard/dashboard.component.spec.ts`
2. `npm test`
3. `npx vitest run --coverage --coverage.include=src/app/services/session.service.ts`
4. `npm run build`

### Resultado
- Caracterización previa: **3 archivos / 11 tests OK**
- Después del cambio:
  - `npm test`: **6 archivos / 14 tests OK**
  - Cobertura focalizada en [session.service.ts](./src/app/services/session.service.ts): **92.18%**
  - `npm run build`: **OK**

### Observaciones
- El token se movió a memoria en servicio de sesión; dejó de persistirse en `localStorage`.
- Se preservó el flujo funcional y contratos HTTP.

---

## Próximas iteraciones (plantilla)

### Iteración: I-XX
- **Objetivo**:
- **Comandos ejecutados**:
  1.
  2.
- **Resultado**:
- **Observaciones**:
