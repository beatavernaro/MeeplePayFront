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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
}
