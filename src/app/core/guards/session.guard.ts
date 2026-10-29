import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LocalStorageService } from '../services/local-storage.service';
import { ComandaService } from '../services/comanda.service';

@Injectable({
  providedIn: 'root',
})
export class SessionGuard implements CanActivate {
  constructor(
    private localStorageService: LocalStorageService,
    private comandaService: ComandaService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    const hasValidUserData = this.localStorageService.hasValidUserData();

    if (!hasValidUserData) {
      // Redirecionar para a página de início se não há dados válidos
      return this.router.createUrlTree(['/start']);
    }

    // Atualizar última atividade
    this.localStorageService.updateLastActivity();

    const comandaId = this.localStorageService.getUserData()?.comandaId;
    if (!comandaId) {
      return true;
    }

    // Consultar o status atual no servidor: comanda encerrada ou paga não pode mais ser acessada
    return this.comandaService.buscarComanda(comandaId).pipe(
      map((comanda) => comanda.status === 'ABERTA' ? true : this.router.createUrlTree(['/encerrada'])),
      // Em caso de falha a própria tela trata o erro (redireciona para /start)
      catchError(() => of(true)),
    );
  }
}
