import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';

// Só abre o painel depois que a API confirma o token de admin (ex.: ao dar F5 com um token
// assinado por uma chave antiga). Sem sessão válida volta para o login.
export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AdminAuthService)
    .verificarSessao()
    .pipe(map((valida) => valida || router.createUrlTree(['/admin/login'])));
};
