import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

// Sem token de admin válido (ausente, expirado ou malformado) volta para o login
export const adminAuthGuard: CanActivateFn = () =>
  inject(AdminAuthService).isAuthenticated() || inject(Router).createUrlTree(['/admin/login']);
