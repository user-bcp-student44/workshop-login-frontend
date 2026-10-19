import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { DashboardComponent } from './dashboard.component';

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

type LocalStorageMock = {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};

function createLocalStorageMock(): LocalStorageMock {
  return {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };
}

describe('DashboardComponent characterization', () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = createLocalStorageMock();

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true
    });
  });

  function createComponent(overrides?: { token?: string | null; user?: { username?: string } }) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const cdr = { detectChanges: vi.fn() };
    const zone = { run: (cb: () => void) => cb() };
    const tasksService = { getTasks: vi.fn() };
    const sessionService = {
      getToken: vi.fn().mockReturnValue(overrides?.token ?? null),
      getUser: vi.fn().mockReturnValue(overrides?.user ?? {})
    };

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'workshop_token') {
        return overrides?.token ?? null;
      }

      if (key === 'workshop_user') {
        return JSON.stringify(overrides?.user ?? {});
      }

      return null;
    });

    const component = new (DashboardComponent as any)(
      router,
      cdr,
      zone,
      tasksService,
      sessionService
    ) as DashboardComponent;

    return { component, router, cdr, tasksService, sessionService };
  }

  it('redirects to /login when there is no session token', async () => {
    const { component, router } = createComponent({ token: null });

    await component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('requests tasks for authenticated user with preserved contract', async () => {
    const { component, tasksService } = createComponent({
      token: 'token-abc',
      user: { username: 'student' }
    });

    const taskItems = [{ title: 'Task', description: 'Desc', status: 'TODO', priority: 'HIGH', owner: 'student' }];
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: taskItems });
    tasksService.getTasks.mockResolvedValue(taskItems);

    await component.ngOnInit();

    const axiosWasUsed = (axios.get as unknown as ReturnType<typeof vi.fn>).mock.calls.length > 0;
    const serviceWasUsed = tasksService.getTasks.mock.calls.length > 0;

    expect(axiosWasUsed || serviceWasUsed).toBe(true);

    if (axiosWasUsed) {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/tasks?owner=student',
        expect.objectContaining({
          headers: { Authorization: 'Bearer token-abc' }
        })
      );
    }

    if (serviceWasUsed) {
      expect(tasksService.getTasks).toHaveBeenCalledWith('student', 'token-abc');
    }
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

  it('clears session and navigates to /login on logout', async () => {
    const { component, router, sessionService } = createComponent();
    sessionService.clearSession = vi.fn();

    await component.logout();

    const sessionServiceUsed = sessionService.clearSession.mock.calls.length > 0;
    const localStorageUsed = localStorageMock.removeItem.mock.calls.length >= 2;

    expect(sessionServiceUsed || localStorageUsed).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows dashboard error when token is invalid or expired', async () => {
    const { component, tasksService } = createComponent({
      token: 'expired-token',
      user: { username: 'student' }
    });

    tasksService.getTasks.mockRejectedValue({
      response: { status: 401, data: { detail: 'Unauthorized' } },
      message: 'Request failed with status code 401'
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
});
