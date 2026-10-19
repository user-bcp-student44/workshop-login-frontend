# Testing del flujo de login y consulta de tareas

## Matriz de pruebas

| flujo | caso | tipo | resultado esperado |
|---|---|---|---|
| Login | Credenciales válidas (`student` / `Workshop123!`) | Camino feliz | Guarda sesión vía `SessionService.saveSession(...)` y navega a `/dashboard`. |
| Dashboard | Sesión válida con token y usuario | Camino feliz | Llama `TasksService.getTasks(owner, token)`, carga tareas y no muestra error. |
| Dashboard | Lista con tareas `ARCHIVED` mezcladas con visibles | Caso borde | Filtra `ARCHIVED` y conserva `label` calculado para las tarjetas visibles. |
| Login | Usuario vacío | Caso borde | No llama backend y muestra `Ingrese un usuario.` |
| Login | Contraseña vacía | Caso borde | No llama backend y muestra `Ingrese una contraseña.` |
| Login | Backend responde sin token | Caso borde | Muestra `El backend respondió sin token.` y no navega. |
| Login | Backend caído (`Network Error`) | Error | Muestra error genérico de autenticación sin exponer detalle técnico. |
| Login | Timeout (`ECONNABORTED`) | Error | Muestra error genérico de autenticación sin exponer detalle técnico. |
| Dashboard | Token inválido/expirado (401) al consultar tareas | Error | Muestra `No se pudo cargar el dashboard` y termina carga (`loading = false`). |
| Dashboard | Timeout al consultar tareas | Error | Muestra `No se pudo cargar el dashboard` y termina carga (`loading = false`). |

---

## Código de tests implementados

### 1) Login: camino feliz, borde y errores
Archivo: `src/app/login/login.component.spec.ts`

```ts
it('keeps login flow when authentication succeeds', async () => {
  const { component, router, authService, sessionService } = createComponent();
  component.username = 'student';
  component.password = 'Workshop123!';

  authService.login.mockResolvedValue({
    token: 'token-123',
    user: { username: 'student' }
  });

  await component.login();

  expect(sessionService.saveSession).toHaveBeenCalled();
  expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
});

it('shows validation message when username is missing', async () => {
  const { component } = createComponent();
  component.username = '';
  component.password = 'Workshop123!';

  await component.login();

  expect(asMessageText(component.message)).toContain('Ingrese un usuario');
});

it('shows validation message when password is missing', async () => {
  const { component } = createComponent();
  component.username = 'student';
  component.password = '   ';

  await component.login();

  expect(asMessageText(component.message)).toContain('Ingrese una contraseña');
});

it('shows functional error when backend response has no token', async () => {
  const { component, router, authService, sessionService } = createComponent();
  component.username = 'student';
  component.password = 'Workshop123!';

  authService.login.mockResolvedValue({
    user: { username: 'student' }
  });

  await component.login();

  expect(asMessageText(component.message)).toContain('El backend respondió sin token.');
  expect(sessionService.saveSession).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
});

it('shows generic message when authentication backend is down', async () => {
  const { component, authService } = createComponent();
  component.username = 'student';
  component.password = 'Workshop123!';

  authService.login.mockRejectedValue(new Error('Network Error'));
  await component.login();

  expect(asMessageText(component.message)).toContain('No se pudo autenticar');
});

it('shows generic message when login request times out', async () => {
  const { component, authService } = createComponent();
  component.username = 'student';
  component.password = 'Workshop123!';

  authService.login.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' });
  await component.login();

  expect(asMessageText(component.message)).toContain('No se pudo autenticar');
});
```

### 2) Dashboard: camino feliz y errores de tareas
Archivo: `src/app/dashboard/dashboard.component.spec.ts`

```ts
it('requests tasks for authenticated user with preserved contract', async () => {
  const { component, tasksService } = createComponent({
    token: 'token-abc',
    user: { username: 'student' }
  });

  tasksService.getTasks.mockResolvedValue([
    { title: 'Task', description: 'Desc', status: 'TODO', priority: 'HIGH', owner: 'student' }
  ]);

  await component.ngOnInit();

  expect(tasksService.getTasks).toHaveBeenCalledWith('student', 'token-abc');
  expect(component.error).toBe('');
  expect(component.loading).toBe(false);
});

it('filters archived tasks and keeps visible business data for dashboard cards', async () => {
  const { component, tasksService } = createComponent({
    token: 'token-abc',
    user: { username: 'student' }
  });

  tasksService.getTasks.mockResolvedValue([
    { title: 'Archived', description: 'D0', status: 'ARCHIVED', priority: 'LOW', owner: 'student' },
    { title: 'Low', description: 'D1', status: 'TODO', priority: 'LOW', owner: 'student' },
    { title: 'High', description: 'D2', status: 'TODO', priority: 'HIGH', owner: 'student' }
  ]);

  await component.ngOnInit();

  expect(component.visibleTasks).toHaveLength(2);
  expect(component.visibleTasks.every((task) => task.status !== 'ARCHIVED')).toBe(true);
  expect(component.visibleTasks.every((task) => typeof task.label === 'string' && task.label.length > 0)).toBe(true);
});

it('shows dashboard error when token is invalid or expired', async () => {
  const { component, tasksService } = createComponent({
    token: 'expired-token',
    user: { username: 'student' }
  });

  tasksService.getTasks.mockRejectedValue({
    response: { status: 401, data: { detail: 'Unauthorized' } }
  });

  await component.ngOnInit();

  expect(component.error).toBe('No se pudo cargar el dashboard');
  expect(component.loading).toBe(false);
});

it('shows dashboard error when tasks request times out', async () => {
  const { component, tasksService } = createComponent({
    token: 'token-abc',
    user: { username: 'student' }
  });

  tasksService.getTasks.mockRejectedValue({
    code: 'ECONNABORTED',
    message: 'timeout of 5000ms exceeded'
  });

  await component.ngOnInit();

  expect(component.error).toBe('No se pudo cargar el dashboard');
  expect(component.loading).toBe(false);
});
```

---

## Ejecuciones reales

### Ejecución 1 — Suite completa
- **Directorio**: `C:\Users\Usuario\Documents\t08267-christian-lopez\reqflow-workspace\workshop-login-frontend`
- **Comando**: `npm test`
- **Código de salida**: `0`
- **Resultado**:
  - `Test Files 6 passed (6)`
  - `Tests 20 passed (20)`

### Ejecución 2 — Cobertura focalizada (flujo login+tareas)
- **Directorio**: `C:\Users\Usuario\Documents\t08267-christian-lopez\reqflow-workspace\workshop-login-frontend`
- **Comando**: `npx vitest run --coverage --coverage.include=src/app/login/login.component.ts --coverage.include=src/app/dashboard/dashboard.component.ts --coverage.include=src/app/services/auth.service.ts --coverage.include=src/app/services/tasks.service.ts --coverage.include=src/app/services/session.service.ts`
- **Código de salida**: `0`
- **Resultado de cobertura**:
  - `All files: 94.91%` (meta REGLAS >= 85% cumplida)
  - `login.component.ts: 92.64%`
  - `dashboard.component.ts: 97.33%`
  - `auth.service.ts: 100%`
  - `tasks.service.ts: 100%`
  - `session.service.ts: 92.18%`

---

## Fallos detectados
- No hubo fallos de tests en la ejecución final.
- Los mensajes en `stderr` corresponden a errores simulados por pruebas de resiliencia (comportamiento esperado de los casos de error).

## Pendientes
- No hay pendientes para los casos exigidos en este objetivo.

## Pruebas propuestas (siguientes iteraciones)
- Prueba de integración de navegación completa login -> dashboard -> logout con harness de router.
- Pruebas E2E en navegador real para validar comportamiento visual de estados de carga y error.

---

## Documentos consultados
- `docs/ENDPOINTS.md`
- `REGLAS.md`
- `src/app/login/login.component.ts`
- `src/app/dashboard/dashboard.component.ts`
- `src/app/services/auth.service.ts`
- `src/app/services/tasks.service.ts`
- `src/app/services/session.service.ts`
- `src/app/login/login.component.spec.ts`
- `src/app/dashboard/dashboard.component.spec.ts`
