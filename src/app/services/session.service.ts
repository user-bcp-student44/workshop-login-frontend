import { Injectable } from '@angular/core';
import { SessionUser, UserPreferences } from '../models/auth.models';

const WORKSHOP_TOKEN_KEY = 'workshop_token';
const WORKSHOP_USER_KEY = 'workshop_user';
const WORKSHOP_PREFERENCES_KEY = 'workshop_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  showTips: true,
  compact: false
};

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sessionToken: string | null = null;

  getToken(): string | null {
    return this.sessionToken;
  }

  setToken(token: string): void {
    this.sessionToken = token;
  }

  getUser(): SessionUser {
    const raw = localStorage.getItem(WORKSHOP_USER_KEY);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as SessionUser;
    } catch (error) {
      console.error('User payload could not be loaded', error);
      return {};
    }
  }

  setUser(user: SessionUser): void {
    localStorage.setItem(WORKSHOP_USER_KEY, JSON.stringify(user));
  }

  loadPreferences(): UserPreferences {
    const raw = localStorage.getItem(WORKSHOP_PREFERENCES_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return {
        theme: parsed.theme ?? DEFAULT_PREFERENCES.theme,
        showTips: parsed.showTips ?? DEFAULT_PREFERENCES.showTips,
        compact: parsed.compact ?? DEFAULT_PREFERENCES.compact
      };
    } catch (error) {
      console.error('Preferences could not be loaded', error);
      return DEFAULT_PREFERENCES;
    }
  }

  setPreferences(preferences: UserPreferences): void {
    localStorage.setItem(WORKSHOP_PREFERENCES_KEY, JSON.stringify(preferences));
  }

  saveSession(token: string, user: SessionUser, preferences: UserPreferences): void {
    this.setToken(token);
    this.setUser(user);
    this.setPreferences(preferences);
  }

  clearSession(): void {
    this.sessionToken = null;
    localStorage.removeItem(WORKSHOP_TOKEN_KEY);
    localStorage.removeItem(WORKSHOP_USER_KEY);
  }
}
