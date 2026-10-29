import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../../shared/models/api.interfaces';

const ADMIN_TOKEN_KEY = 'adminToken';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  // Token que a API já aceitou nesta carga da página (evita repetir a verificação)
  private tokenConfirmado: string | null = null;

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
    this.tokenConfirmado = null;
  }

  /**
   * Confirma com a API que o token salvo ainda vale. O navegador só consegue ver se o token
   * expirou; a assinatura (ex.: chave JWT trocada) e o admin desativado só a API sabe.
   * Emite false e apaga o token quando a API recusa (401/403).
   */
  verificarSessao(): Observable<boolean> {
    const token = this.getToken();
    if (!this.isAuthenticated() || !token) return of(false);
    if (token === this.tokenConfirmado) return of(true);

    return this.http.get<void>(`${this.baseUrl}/auth/sessao`).pipe(
      map(() => {
        this.tokenConfirmado = token;
        return true;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.logout();
          return of(false);
        }
        // API fora do ar: deixa entrar; as telas avisam o erro ao carregar os dados
        return of(true);
      }),
    );
  }

  /**
   * Há um token de admin ainda não expirado. Token expirado ou malformado é apagado.
   * Não confere a assinatura: para isso use verificarSessao().
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
