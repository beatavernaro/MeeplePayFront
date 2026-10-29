import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';
import { SessaoClienteService } from '../services/sessao-cliente.service';

// Endpoints que sempre usam o token do admin
const ADMIN_ENDPOINTS = ['/api/admin', '/api/auth'];

/**
 * Anexa o token correto a cada requisição:
 * - admin: endpoints de admin/auth, ou qualquer requisição feita numa rota /admin;
 * - cliente (JWT da comanda): todo o resto. Nas rotas públicas (abrir comanda, reconectar) o token é ignorado pela API.
 * Também trata 401/403 redirecionando para o login correspondente.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const adminAuthService = inject(AdminAuthService);
  const sessaoCliente = inject(SessaoClienteService);
  const router = inject(Router);

  const isAdminRoute = router.url.includes('/admin');
  const usaTokenAdmin = isAdminRoute || ADMIN_ENDPOINTS.some((e) => req.url.includes(e));

  const token = usaTokenAdmin ? adminAuthService.getToken() : sessaoCliente.getAccessToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // usaTokenAdmin (e não só a rota): no F5 o guard chama /auth/sessao antes da URL do admin ser aplicada
      if (usaTokenAdmin && (error.status === 401 || error.status === 403)) {
        // Token admin expirado, com assinatura antiga ou sem permissão de admin
        adminAuthService.logout();
        router.navigate(['/admin/login']);
      } else if (error.status === 401 || error.status === 403) {
        // Token do cliente expirado, ou tentativa de modificar comanda de outro cliente
        sessaoCliente.limpar();
        router.navigate(['/start']);
      }
      return throwError(() => error);
    }),
  );
};

