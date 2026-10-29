import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda, ComandaStatus, ResumoStatusComanda } from '../../../shared/models/api.interfaces';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

const LIMITE_ABERTAS = 10;
const LIMITE_FINALIZADAS = 5;

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent {
  private router = inject(Router);
  private notificacao = inject(NotificacaoService);
  private erroNotificado = false;

  private comandaService = inject(ComandaService);

  // undefined enquanto carrega
  private readonly resumo = toSignal(
    this.comandaService.obterResumoComandas().pipe(catchError(() => this.falhaAoCarregar([] as ResumoStatusComanda[]))),
  );

  // Só as mais recentes; a lista completa fica na tela de comandas
  readonly comandasAbertas = toSignal(
    this.comandaService
      .listarComandasPaginado({ status: ['ABERTA'], tamanhoPagina: LIMITE_ABERTAS })
      .pipe(
        map((pagina) => pagina.itens),
        catchError(() => this.falhaAoCarregar([] as Comanda[])),
      ),
  );

  readonly ultimasFinalizadas = toSignal(
    this.comandaService
      .listarComandasPaginado({
        status: ['ENCERRADA', 'PAGA'],
        ordenarPor: 'dataEncerramento',
        tamanhoPagina: LIMITE_FINALIZADAS,
      })
      .pipe(
        map((pagina) => pagina.itens),
        catchError(() => this.falhaAoCarregar([] as Comanda[])),
      ),
  );

  readonly totalAbertas = computed(() => this.somarResumo(['ABERTA'], 'quantidade'));
  readonly totalFinalizadas = computed(() => this.somarResumo(['ENCERRADA', 'PAGA'], 'quantidade'));
  readonly totalReceita = computed(() => this.somarResumo(['ENCERRADA', 'PAGA'], 'receita'));

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  visualizarComanda(id: string): void {
    this.router.navigate(['/admin/comandas', id]);
  }

  private somarResumo(status: ComandaStatus[], campo: 'quantidade' | 'receita'): number | undefined {
    return this.resumo()
      ?.filter((r) => status.includes(r.status))
      .reduce((total, r) => total + r[campo], 0);
  }

  // As três chamadas falham juntas quando a API cai: avisa uma vez só
  private falhaAoCarregar<T>(vazio: T) {
    if (!this.erroNotificado) {
      this.erroNotificado = true;
      this.notificacao.erro('Erro ao carregar comandas. Tente novamente.', { duracao: 5000 });
    }
    return of(vazio);
  }
}
