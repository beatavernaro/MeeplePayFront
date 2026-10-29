import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LucideAngularModule } from 'lucide-angular';
import { Produto } from '../../../shared/models/api.interfaces';
import { ProdutoService } from '../../../core/services/produto.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

@Component({
  selector: 'app-admin-produtos',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    LucideAngularModule,
  ],
  template: `
    <div class="page produtos-page">
      <div class="page-header">
        <div class="page-header__title">
          <div>
            <h1>Gerenciamento de Produtos</h1>
            <p class="page-header__subtitle">Cadastre produtos, preços e estoque</p>
          </div>
        </div>
        <div class="page-header__actions">
          <button mat-raised-button (click)="criarNovoProduto()">
            <lucide-icon name="plus" />
            Novo Produto
          </button>
        </div>
      </div>

      <!-- Barra de pesquisa -->
      <mat-form-field class="produtos-busca" appearance="outline">
        <mat-label>Buscar produtos</mat-label>
        <input
          matInput
          type="search"
          [value]="termoBusca()"
          (input)="termoBusca.set($any($event.target).value)"
          placeholder="Digite o nome do produto..."
        />
        <lucide-icon matSuffix name="search" />
      </mat-form-field>

      <!-- Tabela de produtos -->
      <div class="surface-card table-surface">
        <div class="table-scroll">
          <table mat-table [dataSource]="produtosFiltrados() ?? []">
            <!-- Coluna Nome -->
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome do Produto</th>
              <td mat-cell *matCellDef="let produto">
                <div class="produto-cell">
                  <span class="produto-cell__name">{{ produto.nome }}</span>
                  @if (produto.estoque <= 0) {
                    <span class="status-badge status-badge--warning">
                      <lucide-icon name="triangle-alert" />
                      Sem estoque
                    </span>
                  }
                  @if (!produto.ativo) {
                    <span class="status-badge status-badge--danger">Inativo</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Coluna Valor Unitário -->
            <ng-container matColumnDef="preco">
              <th mat-header-cell *matHeaderCellDef>Valor Unitário</th>
              <td mat-cell *matCellDef="let produto">
                <span class="money produto-preco">{{ produto.preco | currency }}</span>
              </td>
            </ng-container>

            <!-- Coluna Estoque -->
            <ng-container matColumnDef="estoque">
              <th mat-header-cell *matHeaderCellDef>Estoque</th>
              <td mat-cell *matCellDef="let produto">
                <span class="money" [class.estoque-zerado]="produto.estoque <= 0">
                  {{ produto.estoque }}
                </span>
              </td>
            </ng-container>

            <!-- Coluna Ações -->
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef class="col-acoes">Ações</th>
              <td mat-cell *matCellDef="let produto" class="col-acoes">
                <div class="row-actions">
                  <button
                    mat-icon-button
                    class="row-action row-action--edit"
                    matTooltip="Editar produto"
                    matTooltipPosition="above"
                    matTooltipShowDelay="300"
                    matTooltipClass="produtos-tooltip"
                    aria-label="Editar produto"
                    (click)="editarProduto(produto)"
                  >
                    <lucide-icon name="pencil" />
                  </button>
                  <button
                    mat-icon-button
                    class="row-action"
                    matTooltip="Detalhes do produto"
                    matTooltipPosition="above"
                    matTooltipShowDelay="300"
                    matTooltipClass="produtos-tooltip"
                    aria-label="Detalhes do produto"
                    (click)="verDetalhes(produto.id)"
                  >
                    <lucide-icon name="eye" />
                  </button>
                  <button
                    mat-icon-button
                    class="row-action"
                    [class.row-action--danger]="produto.ativo"
                    [class.row-action--success]="!produto.ativo"
                    [matTooltip]="produto.ativo ? 'Desativar produto' : 'Ativar produto'"
                    matTooltipPosition="above"
                    matTooltipClass="produtos-tooltip"
                    [attr.aria-label]="produto.ativo ? 'Desativar produto' : 'Ativar produto'"
                    (click)="toggleStatusProduto(produto)"
                  >
                    <lucide-icon [name]="produto.ativo ? 'toggle-right' : 'toggle-left'" />
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>

        <!-- Mensagem quando não há produtos -->
        @if (produtosFiltrados(); as produtosFiltrados) {
          @if (produtosFiltrados.length === 0) {
            <div class="empty-state">
              <lucide-icon name="package" />
              <h3>
                {{
                  produtos()?.length === 0
                    ? 'Nenhum produto cadastrado'
                    : 'Nenhum produto encontrado para "' + termoBusca() + '"'
                }}
              </h3>
              @if (produtos()?.length === 0) {
                <button mat-raised-button (click)="criarNovoProduto()">
                  <lucide-icon name="plus" />
                  Cadastrar Primeiro Produto
                </button>
              }
            </div>
          }
        } @else {
          <div class="empty-state" role="status">
            <p>Carregando produtos...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .produtos-page .produtos-busca {
        width: 100%;
        max-width: 400px;
      }

      .produtos-page .produto-cell {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-width: 0;
      }

      .produtos-page .produto-cell__name {
        font-weight: var(--weight-semibold);
        overflow-wrap: anywhere;
      }

      .produtos-page .produto-preco {
        color: var(--color-text);
      }

      .produtos-page .estoque-zerado {
        color: var(--color-danger);
      }

      .produtos-page .mat-mdc-cell,
      .produtos-page .mat-mdc-header-cell {
        padding: 0 16px;
      }

      .produtos-page .col-acoes {
        text-align: center;
        width: 160px;
      }

      .produtos-page .row-actions {
        display: flex;
        gap: var(--space-1);
        justify-content: center;
      }

      .produtos-page .row-action {
        color: var(--color-icon);
      }

      .produtos-page .row-action:hover {
        color: var(--color-primary);
      }

      .produtos-page .row-action--danger:hover {
        color: var(--color-danger);
      }

      .produtos-page .row-action--success {
        color: var(--color-success);
      }

      @media (max-width: 768px) {
        .produtos-page .produtos-busca {
          max-width: none;
        }
      }
    `,
  ],
})
export class AdminProdutosComponent {
  private produtoService = inject(ProdutoService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly displayedColumns = ['nome', 'preco', 'estoque', 'acoes'];
  readonly termoBusca = signal('');

  // undefined enquanto carrega
  readonly produtos = signal<Produto[] | undefined>(undefined);
  readonly produtosFiltrados = computed(() => {
    const produtos = this.produtos();
    const termo = this.termoBusca();
    if (!produtos || !termo.trim()) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo.toLowerCase()));
  });

  constructor() {
    this.carregarProdutos();
  }

  editarProduto(produto: Produto): void {
    this.router.navigate(['/admin/produtos', produto.id, 'editar']);
  }

  criarNovoProduto(): void {
    this.router.navigate(['/admin/produtos/novo']);
  }

  verDetalhes(produtoId: string): void {
    this.router.navigate(['/admin/produtos', produtoId]);
  }

  toggleStatusProduto(produto: Produto): void {
    const acao = produto.ativo ? 'desativar' : 'ativar';
    const acaoCapitalizada = acao.charAt(0).toUpperCase() + acao.slice(1);

    this.notificacao
      .confirmar(
        {
          title: `${acaoCapitalizada} Produto`,
          message: `Tem certeza que deseja ${acao} o produto "${produto.nome}"?`,
          confirmText: acaoCapitalizada,
          cancelText: 'Cancelar',
        },
        '400px',
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.produtoService.atualizarProduto(produto.id, { ativo: !produto.ativo }).subscribe({
          next: () => {
            this.notificacao.sucesso(
              `Produto ${!produto.ativo ? 'ativado' : 'desativado'} com sucesso`,
            );
            this.carregarProdutos();
          },
          error: (error) => {
            console.error(`Erro ao ${acao} produto:`, error);
            this.notificacao.erro(`Erro ao ${acao} produto`);
          },
        });
      });
  }

  private carregarProdutos(): void {
    this.produtoService.obterTodosProdutos().subscribe({
      next: (produtos) => this.produtos.set(produtos),
      error: (error) => {
        console.error('Erro ao carregar produtos:', error);
        this.notificacao.erro('Erro ao carregar produtos');
        this.produtos.set([]);
      },
    });
  }
}
