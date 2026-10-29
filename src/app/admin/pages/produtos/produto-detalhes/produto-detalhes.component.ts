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
import { LucideAngularModule } from 'lucide-angular';

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
    LucideAngularModule,
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
              <lucide-icon name="arrow-left" />
            </button>
            <h1>{{ produto.nome }}</h1>
            <span *ngIf="!produto.ativo" class="status-badge status-badge--danger">Inativo</span>
          </div>
        </div>
      </ng-container>

      <div class="detalhes-grid" *ngIf="produto$ | async as produto">
        <!-- Informações básicas do produto -->
        <mat-card>
          <mat-card-header class="card-header">
            <mat-card-title>
              <lucide-icon name="info" />
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
                  <lucide-icon *ngIf="produto.estoque <= 0" aria-label="Sem estoque" name="triangle-alert" />
                  {{ produto.estoque }}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    class="status-badge"
                    [class.status-badge--success]="produto.ativo"
                    [class.status-badge--danger]="!produto.ativo"
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
              <lucide-icon name="chart-line" />
              Estatísticas de Vendas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-list">
              <div class="stat-row">
                <span class="stat-row__label">Unidades vendidas</span>
                <span class="stat-row__value money">{{ (estatisticas$ | async)?.totalVendido || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">Receita gerada</span>
                <span class="stat-row__value stat-row__value--accent money">
                  R$ {{ formatarMoeda((estatisticas$ | async)?.receitaTotal || 0) }}
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">Comandas que incluíram</span>
                <span class="stat-row__value money">{{ (estatisticas$ | async)?.comandasComProduto || 0 }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Ações do produto -->
      <div class="detalhes-actions" *ngIf="produto$ | async as produto">
        <button mat-raised-button (click)="editarProduto(produto)">
          <lucide-icon name="pencil" />
          Editar Produto
        </button>
        <button
          mat-stroked-button
          [class.btn-danger-outline]="produto.ativo"
          (click)="toggleStatus(produto)"
        >
          <lucide-icon [name]="produto.ativo ? 'toggle-left' : 'toggle-right'" />
          {{ produto.ativo ? 'Desativar' : 'Ativar' }} Produto
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="!(produto$ | async)" class="empty-state" role="status">
        <lucide-icon class="spin" name="loader-circle" />
        <p>Carregando informações do produto...</p>
      </div>
    </div>
  `,
  styles: [
    `
      .detalhes-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .card-header {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      mat-card-title lucide-icon {
        color: var(--color-icon);
      }

      mat-card-content {
        padding: var(--space-2) var(--space-4) var(--space-3) !important;
      }

      .info-list > div,
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-3);
        min-height: 44px;
        padding: var(--space-2) 0;
      }

      .info-list > div + div,
      .stat-row + .stat-row {
        border-top: 1px solid var(--color-border);
      }

      dt,
      .stat-row__label {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }

      .info-value {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        color: var(--color-text);
        text-align: right;
      }

      .info-value--price {
        font-size: var(--text-lg);
        font-weight: var(--weight-semibold);
      }

      .estoque-zerado {
        color: var(--color-danger);
      }

      .estoque-zerado lucide-icon {
        color: var(--color-warning);
      }

      .stat-row__value {
        font-size: var(--text-lg);
        color: var(--color-text);
      }

      .stat-row__value--accent {
        color: var(--color-accent);
      }

      .detalhes-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-top: var(--space-4);
      }

      @media (max-width: 768px) {
        .detalhes-grid {
          grid-template-columns: 1fr;
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
