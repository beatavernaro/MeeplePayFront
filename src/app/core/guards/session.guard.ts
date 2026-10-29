import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LocalStorageService } from '../services/local-storage.service';
import { ComandaService } from '../services/comanda.service';

/**
 * Exige sessão do cliente; comanda encerrada ou paga vai para /encerrada.
 */
export const sessionGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const comandaService = inject(ComandaService);
  const router = inject(Router);

  if (!localStorageService.hasValidUserData()) {
    return router.createUrlTree(['/start']);
  }

  localStorageService.updateLastActivity();

  const comandaId = localStorageService.getUserData()?.comandaId;
  if (!comandaId) {
    return true;
  }

  // Consultar o status atual no servidor: comanda encerrada ou paga não pode mais ser acessada
  return comandaService.buscarComanda(comandaId).pipe(
    map((comanda) => (comanda.status === 'ABERTA' ? true : router.createUrlTree(['/encerrada']))),
    // Em caso de falha a própria tela trata o erro (redireciona para /start)
    catchError(() => of(true)),
  );
};
