import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent {
  private router = inject(Router);
  private notificacao = inject(NotificacaoService);

  // undefined enquanto carrega
  private readonly comandas = toSignal(
    inject(ComandaService)
      .obterComandasCompletas()
      .pipe(
        catchError(() => {
          this.notificacao.erro('Erro ao carregar comandas. Tente novamente.', { duracao: 5000 });
          return of([]);
        }),
      ),
  );

  readonly comandasAbertas = computed(() => this.comandas()?.filter((c) => c.status === 'ABERTA'));
  readonly comandasFinalizadas = computed(() =>
    this.comandas()?.filter((c) => c.status === 'ENCERRADA' || c.status === 'PAGA'),
  );
  readonly totalReceita = computed(() =>
    (this.comandasFinalizadas() ?? []).reduce((total, c) => total + c.valorTotal, 0),
  );

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  visualizarComanda(id: string): void {
    this.router.navigate(['/admin/comandas', id]);
  }
}
