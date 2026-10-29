import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ComandaService } from '../services/comanda.service';
import { SessaoClienteService } from '../services/sessao-cliente.service';

/**
 * Exige uma sessão de cliente (carregada nesta página ou salva há menos de 6h);
 * sem ela, o cliente entra pelo celular em /start. Comanda encerrada ou paga vai para /encerrada.
 */
export const sessionGuard: CanActivateFn = () => {
  const comandaService = inject(ComandaService);
  const sessaoCliente = inject(SessaoClienteService);
  const router = inject(Router);

  const comandaId = comandaService.comandaAtual()?.id ?? sessaoCliente.getComandaId();
  if (!comandaId || !sessaoCliente.getAccessToken()) {
    return router.createUrlTree(['/start']);
  }

  // Consultar o status atual no servidor (também recupera a comanda após recarregar a página)
  return comandaService.buscarComanda(comandaId).pipe(
    map((atual) => (atual.status === 'ABERTA' ? true : router.createUrlTree(['/encerrada']))),
    // Se já há comanda carregada a própria tela trata o erro; sem ela, não há o que mostrar
    catchError(() => of(comandaService.comandaAtual() ? true : router.createUrlTree(['/start']))),
  );
};
