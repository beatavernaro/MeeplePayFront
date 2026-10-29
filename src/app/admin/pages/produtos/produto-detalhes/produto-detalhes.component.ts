import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { switchMap, map, catchError, shareReplay } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { Produto } from '../../../../shared/models/produto.model';
import { ProdutoService } from '../../../../core/services/produto.service';
import { ComandaService } from '../../../../core/services/comanda.service';
import { Comanda } from '../../../../shared/models/comanda.model';
import { ItemComanda } from '../../../../shared/models/item-comanda.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface Estatisticas {
  totalVendido: number;
  receitaTotal: number;
  comandasComProduto: number;
}

@Component({
  selector: 'app-produto-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page">
      <!-- Header com navegação -->
      <ng-container *ngIf="produto$ | async as produto">
        <div class="page-header">
          <div class="page-header__title">
            <button mat-icon-button (click)="voltar()" matTooltip="Voltar" aria-label="Voltar" class="back-button">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <span class="icon-tile icon-tile--brand" aria-hidden="true"><mat-icon>restaurant_menu</mat-icon></span>
            <h1>{{ produto.nome }}</h1>
            <span *ngIf="!produto.ativo" class="status-pill status-pill--danger">Inativo</span>
          </div>
        </div>
      </ng-container>

      <div class="detalhes-grid" *ngIf="produto$ | async as produto">
        <!-- Informações básicas do produto -->
        <mat-card>
          <mat-card-header class="card-header">
            <mat-card-title>
              <mat-icon aria-hidden="true">info</mat-icon>
              Informações do Produto
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <dl class="info-list">
              <div>
                <dt>Nome</dt>
                <dd class="info-value">{{ produto.nome }}</dd>
              </div>
              <div>
                <dt>Preço</dt>
                <dd class="info-value info-value--price money">R$ {{ formatarMoeda(produto.preco) }}</dd>
              </div>
              <div>
                <dt>Estoque</dt>
                <dd class="info-value money" [class.estoque-zerado]="produto.estoque <= 0">
                  <mat-icon *ngIf="produto.estoque <= 0" aria-label="Sem estoque">warning</mat-icon>
                  {{ produto.estoque }}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    class="status-pill"
                    [class.status-pill--success]="produto.ativo"
                    [class.status-pill--danger]="!produto.ativo"
                  >
                    {{ produto.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>

        <!-- Estatísticas do produto -->
        <mat-card>
          <mat-card-header class="card-header">
            <mat-card-title>
              <mat-icon aria-hidden="true">insights</mat-icon>
              Estatísticas de Vendas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-list">
              <div class="stat-tile">
                <div class="stat-tile__value money">{{ (estatisticas$ | async)?.totalVendido || 0 }}</div>
                <div class="stat-tile__label">Total de Unidades Vendidas</div>
              </div>
              <div class="stat-tile stat-tile--violet">
                <div class="stat-tile__value money">
                  R$ {{ formatarMoeda((estatisticas$ | async)?.receitaTotal || 0) }}
                </div>
                <div class="stat-tile__label">Receita Total Gerada</div>
              </div>
              <div class="stat-tile stat-tile--green">
                <div class="stat-tile__value money">{{ (estatisticas$ | async)?.comandasComProduto || 0 }}</div>
                <div class="stat-tile__label">Comandas que Incluíram</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Ações do produto -->
      <div class="detalhes-actions" *ngIf="produto$ | async as produto">
        <button mat-raised-button (click)="editarProduto(produto)">
          <mat-icon aria-hidden="true">edit</mat-icon>
          Editar Produto
        </button>
        <button
          mat-raised-button
          [class.btn-danger]="produto.ativo"
          [class.btn-success]="!produto.ativo"
          (click)="toggleStatus(produto)"
        >
          <mat-icon aria-hidden="true">{{ produto.ativo ? 'toggle_off' : 'toggle_on' }}</mat-icon>
          {{ produto.ativo ? 'Desativar' : 'Ativar' }} Produto
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="!(produto$ | async)" class="empty-state" role="status">
        <mat-icon class="spin" aria-hidden="true">sync</mat-icon>
        <p>Carregando informações do produto...</p>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      .back-button {
        color: var(--color-text-secondary);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
      }

      .detalhes-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-5);
      }

      .card-header {
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border);
        margin-bottom: var(--space-2);
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-base);
      }

      mat-card-title mat-icon {
        color: var(--color-primary);
      }

      .info-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-2) 0;
      }

      dt {
        font-size: var(--text-xs);
        font-weight: var(--weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-secondary);
        margin-bottom: 2px;
      }

      .info-value {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-lg);
        font-weight: var(--weight-semibold);
        color: var(--color-text);
      }

      .info-value--price {
        font-size: var(--text-2xl);
        font-weight: var(--weight-extrabold);
        color: var(--color-primary);
      }

      .estoque-zerado {
        color: var(--color-danger);
      }

      .estoque-zerado mat-icon {
        color: var(--color-warning);
      }

      .stats-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-2) 0;
      }

      .stat-tile {
        padding: var(--space-4);
        border-radius: var(--radius-md);
        background: var(--color-primary-soft);
        text-align: center;
      }

      .stat-tile__value {
        font-size: var(--text-3xl);
        font-weight: var(--weight-extrabold);
        color: var(--color-primary);
      }

      .stat-tile--violet {
        background: var(--color-secondary-soft);
      }

      .stat-tile--violet .stat-tile__value {
        color: var(--color-secondary);
      }

      .stat-tile--green {
        background: var(--color-success-soft);
      }

      .stat-tile--green .stat-tile__value {
        color: var(--color-success);
      }

      .stat-tile__label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .detalhes-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        margin-top: var(--space-6);
      }

      @media (max-width: 768px) {
        .detalhes-grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .detalhes-actions button {
          flex: 1 1 100%;
        }
      }
    `,
  ],
})
export class ProdutoDetalhesComponent implements OnInit {
  produto$!: Observable<Produto | null>;
  estatisticas$!: Observable<Estatisticas>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtoService: ProdutoService,
    private comandaService: ComandaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const produtoId = this.route.snapshot.paramMap.get('id');
    if (produtoId) {
      // Observable do produto
      this.produto$ = this.produtoService.obterProdutoPorId(produtoId).pipe(
        catchError((error) => {
          console.error('Erro ao carregar produto:', error);
          this.snackBar.open('Erro ao carregar produto. Tente novamente.', 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          return of(null);
        }),
        shareReplay(1),
      );

      // Observable das estatísticas baseado no produto
      this.estatisticas$ = this.produto$.pipe(
        switchMap((produto) => {
          if (!produto) {
            return of({ totalVendido: 0, receitaTotal: 0, comandasComProduto: 0 });
          }
          return this.carregarEstatisticas(produto);
        }),
        shareReplay(1),
      );
    }
  }

  private carregarEstatisticas(produto: Produto): Observable<Estatisticas> {
    return this.comandaService.obterComandasCompletas().pipe(
      switchMap((comandas: Comanda[]) => {
        if (comandas.length === 0) {
          return of({ totalVendido: 0, receitaTotal: 0, comandasComProduto: 0 });
        }

        // Criar array de observables para todas as comandas
        const itensObservables = comandas.map((comanda) =>
          this.comandaService.obterItensComanda(comanda.id).pipe(
            map((itens) => ({ comanda, itens })),
            catchError((error) => {
              console.error(`Erro ao carregar itens da comanda ${comanda.id}:`, error);
              return of({ comanda, itens: [] as ItemComanda[] });
            }),
          ),
        );

        // Usar forkJoin para aguardar todas as requisições
        return forkJoin(itensObservables).pipe(
          map((resultados) => {
            let totalVendido = 0;
            let receitaTotal = 0;
            let comandasComProduto = 0;

            resultados.forEach(({ comanda, itens }) => {
              let temProduto = false;

              itens.forEach((item: ItemComanda) => {
                // Priorizar matching por produtoId, fallback para nome
                const isMatch = item.produtoId
                  ? item.produtoId === produto.id
                  : item.nome === produto.nome;

                if (isMatch) {
                  totalVendido += item.quantidade;
                  receitaTotal += item.quantidade * item.valorUnitario;
                  temProduto = true;
                }
              });

              if (temProduto) {
                comandasComProduto++;
              }
            });

            return { totalVendido, receitaTotal, comandasComProduto };
          }),
        );
      }),
      catchError((error) => {
        console.error('Erro ao carregar estatísticas:', error);
        return of({ totalVendido: 0, receitaTotal: 0, comandasComProduto: 0 });
      }),
    );
  }

  voltar(): void {
    this.router.navigate(['/admin/produtos']);
  }

  formatarMoeda(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  editarProduto(produto: Produto): void {
    if (produto && produto.id) {
      this.router.navigate(['/admin/produtos', produto.id, 'editar']);
    }
  }

  toggleStatus(produto: Produto): void {
    if (!produto || !produto.id) return;

    const novoStatus = !produto.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${acao.charAt(0).toUpperCase()}${acao.slice(1)} Produto`,
        message: `Tem certeza que deseja ${acao} o produto "${produto.nome}"?`,
        confirmText: acao.charAt(0).toUpperCase() + acao.slice(1),
        cancelText: 'Cancelar',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && produto.id) {
        const produtoAtualizado = { ...produto, ativo: novoStatus };

        this.produtoService.atualizarProduto(produto.id, produtoAtualizado).subscribe({
          next: () => {
            const mensagem = `Produto ${acao === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`;
            this.snackBar.open(mensagem, 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            // Recarregar página para atualizar dados
            location.reload();
          },
          error: (error) => {
            console.error(`Erro ao ${acao} produto:`, error);
            this.snackBar.open(`Erro ao ${acao} produto. Tente novamente.`, 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }
}
