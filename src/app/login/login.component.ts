import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginResponse, UserPreferences } from '../models/auth.models';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

interface LoginUiError {
  title: string;
  detail?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  busy = false;
  message: LoginUiError | null = null;
  preferences: UserPreferences;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService
  ) {
    this.preferences = this.sessionService.loadPreferences();
  }

  private setValidationMessage(detail: string): void {
    this.message = { title: 'No se pudo autenticar.', detail };
  }

  private setAuthenticationErrorMessage(): void {
    this.message = {
      title: 'No se pudo autenticar.',
      detail: 'Verifica tus credenciales e inténtalo de nuevo.'
    };
  }

  private persistSuccessfulLogin(loginData: LoginResponse): void {
    if (!loginData.token) {
      return;
    }

    this.sessionService.saveSession(loginData.token, loginData.user ?? {}, this.preferences);
  }

  async login(): Promise<void> {
    this.message = null;
    if (this.username.trim() === '') {
      this.setValidationMessage('Ingrese un usuario.');
      return;
    }

    if (this.password.trim() === '') {
      this.setValidationMessage('Ingrese una contraseña.');
      return;
    }

    this.busy = true;
    try {
      const response = await this.authService.login({
        username: this.username,
        password: this.password,
        client: 'angular-workshop'
      });

      if (!response.token) {
        this.message = { title: 'No se pudo autenticar.', detail: 'El backend respondió sin token.' };
        return;
      }

      this.persistSuccessfulLogin(response);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.setAuthenticationErrorMessage();
      console.error(error);
    } finally {
      this.busy = false;
    }
  }
}
