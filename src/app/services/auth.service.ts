import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(
      `${environment.authApiBaseUrl}/auth/login`,
      payload,
      { timeout: 5000 }
    );

    return response.data;
  }
}
