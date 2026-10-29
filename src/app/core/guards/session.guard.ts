import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ComandaService } from '../services/comanda.service';
import { SessaoClienteService } from '../services/sessao-cliente.service';

/**
 * Exige uma comanda carregada nesta página (sem ela, o cliente entra pelo celular em /start);
 * comanda encerrada ou paga vai para /encerrada.
 */
export const sessionGuard: CanActivateFn = () => {
  const comandaService = inject(ComandaService);
  const sessaoCliente = inject(SessaoClienteService);
  const router = inject(Router);

  const comanda = comandaService.comandaAtual();
  if (!comanda || !sessaoCliente.getAccessToken()) {
    return router.createUrlTree(['/start']);
  }

  // Consultar o status atual no servidor: comanda encerrada ou paga não pode mais ser acessada
  return comandaService.buscarComanda(comanda.id).pipe(
    map((atual) => (atual.status === 'ABERTA' ? true : router.createUrlTree(['/encerrada']))),
    // Em caso de falha a própria tela trata o erro
    catchError(() => of(true)),
  );
};
