export interface SessionUser {
  username?: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  client: 'angular-workshop';
}

export interface LoginResponse {
  token?: string;
  user?: SessionUser;
}

export interface UserPreferences {
  theme: string;
  showTips: boolean;
  compact: boolean;
}
