import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../../shared/models/api.interfaces';

const ADMIN_TOKEN_KEY = 'adminToken';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Faz login e guarda o token. Credenciais inválidas retornam erro 401.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, loginData).pipe(
      tap((response) => {
        if (response.success && response.token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
        }
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  /**
   * Há um token de admin ainda válido. Token expirado ou inválido é apagado, para não
   * deixar o painel abrir sem sessão. A assinatura continua sendo conferida pela API.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    if (!tokenAdminValido(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
}

function tokenAdminValido(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { tipo?: string; exp?: number };
    return claims.tipo === 'admin' && typeof claims.exp === 'number' && claims.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
