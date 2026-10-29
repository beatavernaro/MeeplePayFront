import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { EstatisticasProduto, Produto } from '../../../../shared/models/api.interfaces';
import { ProdutoService } from '../../../../core/services/produto.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

const SEM_ESTATISTICAS: EstatisticasProduto = { totalVendido: 0, receitaTotal: 0, comandasComProduto: 0 };

@Component({
  selector: 'app-produto-detalhes',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, MatTooltipModule, LucideAngularModule],
  template: `
    <div class="page">
      @if (produto(); as produto) {
        <!-- Header com navegação -->
        <div class="page-header">
          <div class="page-header__title">
            <button mat-icon-button (click)="voltar()" matTooltip="Voltar" aria-label="Voltar" class="back-button">
              <lucide-icon name="arrow-left" />
            </button>
            <h1>{{ produto.nome }}</h1>
            @if (!produto.ativo) {
              <span class="status-badge status-badge--danger">Inativo</span>
            }
          </div>
        </div>

        <div class="detalhes-grid">
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
                  <dd class="info-value info-value--price money">{{ produto.preco | currency }}</dd>
                </div>
                <div>
                  <dt>Estoque</dt>
                  <dd class="info-value money" [class.estoque-zerado]="produto.estoque <= 0">
                    @if (produto.estoque <= 0) {
                      <lucide-icon aria-label="Sem estoque" name="triangle-alert" />
                    }
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
                  <span class="stat-row__value money">{{ estatisticas().totalVendido }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-row__label">Receita gerada</span>
                  <span class="stat-row__value stat-row__value--accent money">
                    {{ estatisticas().receitaTotal | currency }}
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-row__label">Comandas que incluíram</span>
                  <span class="stat-row__value money">{{ estatisticas().comandasComProduto }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Ações do produto -->
        <div class="detalhes-actions">
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
      } @else {
        <!-- Loading state -->
        <div class="empty-state" role="status">
          <lucide-icon class="spin" name="loader-circle" />
          <p>Carregando informações do produto...</p>
        </div>
      }
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
export class ProdutoDetalhesComponent {
  private router = inject(Router);
  private produtoService = inject(ProdutoService);
  private notificacao = inject(NotificacaoService);
  private readonly produtoId = inject(ActivatedRoute).snapshot.paramMap.get('id');

  readonly produto = signal<Produto | null>(null);

  // Somadas no banco a partir dos itens de todas as comandas
  readonly estatisticas = toSignal(
    this.produtoService.obterEstatisticasProduto(this.produtoId ?? '').pipe(
      catchError((error) => {
        console.error('Erro ao carregar estatísticas:', error);
        return of(SEM_ESTATISTICAS);
      }),
    ),
    { initialValue: SEM_ESTATISTICAS },
  );

  constructor() {
    this.carregarProduto();
  }

  voltar(): void {
    this.router.navigate(['/admin/produtos']);
  }

  editarProduto(produto: Produto): void {
    this.router.navigate(['/admin/produtos', produto.id, 'editar']);
  }

  toggleStatus(produto: Produto): void {
    const novoStatus = !produto.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';
    const acaoCapitalizada = acao.charAt(0).toUpperCase() + acao.slice(1);

    this.notificacao
      .confirmar({
        title: `${acaoCapitalizada} Produto`,
        message: `Tem certeza que deseja ${acao} o produto "${produto.nome}"?`,
        confirmText: acaoCapitalizada,
        cancelText: 'Cancelar',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.produtoService.atualizarProduto(produto.id, { ativo: novoStatus }).subscribe({
          next: () => {
            this.notificacao.sucesso(`Produto ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
            this.carregarProduto();
          },
          error: (error) => {
            console.error(`Erro ao ${acao} produto:`, error);
            this.notificacao.erro(`Erro ao ${acao} produto. Tente novamente.`);
          },
        });
      });
  }

  private carregarProduto(): void {
    if (!this.produtoId) return;

    this.produtoService.obterProdutoPorId(this.produtoId).subscribe({
      next: (produto) => this.produto.set(produto),
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.notificacao.erro('Erro ao carregar produto. Tente novamente.', { duracao: 5000 });
      },
    });
  }
}
