import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
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
 * - cliente (JWT da comanda): todo o resto, exceto as consultas públicas de comanda.
 * Também trata 401/403 redirecionando para o login correspondente.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const adminAuthService = inject(AdminAuthService);
  const sessaoCliente = inject(SessaoClienteService);
  const router = inject(Router);

  const isAdminRoute = router.url.includes('/admin');
  const usaTokenAdmin = isAdminRoute || ADMIN_ENDPOINTS.some((e) => req.url.includes(e));

  let token: string | null = null;
  if (usaTokenAdmin) {
    token = adminAuthService.getToken();
  } else if (!ehEndpointPublico(req)) {
    token = sessaoCliente.getAccessToken();
  }

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isAdminRoute && (error.status === 401 || error.status === 403)) {
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

/**
 * Consultas de comanda por id/celular e reconexão são públicas.
 * Encerrar a comanda exige o token do cliente.
 */
function ehEndpointPublico(req: HttpRequest<unknown>): boolean {
  const encerrar = req.method === 'PUT' && req.url.includes('/encerrar');
  return req.url.includes('/api/comandas/') && !encerrar;
}
