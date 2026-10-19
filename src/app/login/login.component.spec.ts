import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { LoginComponent } from './login.component';

vi.mock('axios', () => ({
  default: {
    post: vi.fn()
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

function asMessageText(message: unknown): string {
  if (typeof message === 'string') {
    return message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  if (message && typeof message === 'object') {
    const loginMessage = message as { title?: string; detail?: string };
    return [loginMessage.title ?? '', loginMessage.detail ?? ''].join(' ').trim();
  }

  return '';
}

function asRawMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message && typeof message === 'object') {
    return JSON.stringify(message);
  }

  return '';
}

describe('LoginComponent characterization', () => {
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

  function createComponent() {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const authService = { login: vi.fn() };
    const sessionService = {
      saveSession: vi.fn(),
      loadPreferences: vi.fn().mockReturnValue({ theme: 'light', showTips: true, compact: false })
    };

    const component = new (LoginComponent as any)(router, authService, sessionService) as LoginComponent;
    return { component, router, authService, sessionService };
  }

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

  it('keeps login flow when authentication succeeds', async () => {
    const { component, router, authService, sessionService } = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';
    const response = {
      token: 'token-123',
      user: { username: 'student' }
    };

    authService.login.mockResolvedValue(response);
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: response });

    await component.login();

    const saveSessionCalled = sessionService.saveSession.mock.calls.length > 0;
    const localStorageCalled = localStorageMock.setItem.mock.calls.length > 0;

    expect(saveSessionCalled || localStorageCalled).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
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

  it('does not expose html payload from backend errors in the UI message', async () => {
    const { component, authService } = createComponent();
    component.username = 'student';
    component.password = 'wrong-password';

    const backendError = {
      response: {
        data: {
          message: '<img src=x onerror=alert(1)>credenciales inválidas'
        }
      },
      message: 'Request failed'
    };

    authService.login.mockRejectedValue(backendError);
    (axios.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(backendError);

    await component.login();

    expect(asRawMessage(component.message)).not.toContain('<img');
    expect(asMessageText(component.message)).toContain('No se pudo autenticar');
  });

  it('shows generic message when authentication backend is down', async () => {
    const { component, authService } = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    authService.login.mockRejectedValue(new Error('Network Error'));

    await component.login();

    expect(asMessageText(component.message)).toContain('No se pudo autenticar');
    expect(asMessageText(component.message)).toContain('Verifica tus credenciales e inténtalo de nuevo.');
  });

  it('shows generic message when login request times out', async () => {
    const { component, authService } = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    authService.login.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' });

    await component.login();

    expect(asMessageText(component.message)).toContain('No se pudo autenticar');
    expect(asMessageText(component.message)).toContain('Verifica tus credenciales e inténtalo de nuevo.');
  });
});
