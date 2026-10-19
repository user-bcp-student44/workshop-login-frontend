import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service';

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

describe('SessionService', () => {
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

  it('stores and reads token in memory only', () => {
    const service = new SessionService();

    service.setToken('token-123');
    const token = service.getToken();

    expect(token).toBe('token-123');
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('workshop_token', 'token-123');
  });

  it('loads user from storage and falls back to empty object when JSON is invalid', () => {
    const service = new SessionService();

    localStorageMock.getItem.mockReturnValueOnce('{"username":"student"}');
    expect(service.getUser()).toEqual({ username: 'student' });

    localStorageMock.getItem.mockReturnValueOnce('{invalid');
    expect(service.getUser()).toEqual({});
  });

  it('loads default preferences and merges stored values', () => {
    const service = new SessionService();

    localStorageMock.getItem.mockReturnValueOnce(null);
    expect(service.loadPreferences()).toEqual({ theme: 'light', showTips: true, compact: false });

    localStorageMock.getItem.mockReturnValueOnce('{"theme":"dark"}');
    expect(service.loadPreferences()).toEqual({ theme: 'dark', showTips: true, compact: false });
  });

  it('saves full session and clears session keys', () => {
    const service = new SessionService();

    service.saveSession('token-999', { username: 'student' }, { theme: 'dark', showTips: false, compact: true });
    service.clearSession();

    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('workshop_token', 'token-999');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('workshop_user', JSON.stringify({ username: 'student' }));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'workshop_preferences',
      JSON.stringify({ theme: 'dark', showTips: false, compact: true })
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('workshop_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('workshop_user');
  });
});
