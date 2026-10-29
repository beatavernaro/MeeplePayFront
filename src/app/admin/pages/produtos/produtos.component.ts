import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError, shareReplay, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { Produto } from '../../../shared/models/produto.model';
import { ProdutoService } from '../../../core/services/produto.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-produtos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LucideAngularModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
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
          [(ngModel)]="termoBusca"
          (ngModelChange)="filtrarProdutos()"
          placeholder="Digite o nome do produto..."
        />
        <lucide-icon matSuffix name="search" />
      </mat-form-field>

      <!-- Tabela de produtos -->
      <div class="surface-card table-surface">
        <div class="table-scroll">
          <table mat-table [dataSource]="(produtosFiltrados$ | async) || []">
            <!-- Coluna Nome -->
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome do Produto</th>
              <td mat-cell *matCellDef="let produto">
                <div class="produto-cell">
                  <span class="produto-cell__name">{{ produto.nome }}</span>
                  <span *ngIf="produto.estoque <= 0" class="status-badge status-badge--warning">
                    <lucide-icon name="triangle-alert" />
                    Sem estoque
                  </span>
                  <span *ngIf="!produto.ativo" class="status-badge status-badge--danger">Inativo</span>
                </div>
              </td>
            </ng-container>

            <!-- Coluna Valor Unitário -->
            <ng-container matColumnDef="preco">
              <th mat-header-cell *matHeaderCellDef>Valor Unitário</th>
              <td mat-cell *matCellDef="let produto">
                <span class="money produto-preco">R$ {{ formatarMoeda(produto.preco) }}</span>
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
                    aria-label="Detalhes do produto"
                    (click)="verDetalhes(produto.id!)"
                  >
                    <lucide-icon name="eye" />
                  </button>
                  <button
                    mat-icon-button
                    class="row-action"
                    [class.row-action--danger]="produto.ativo"
                    [class.row-action--success]="!produto.ativo"
                    matTooltip="{{ produto.ativo ? 'Desativar produto' : 'Ativar produto' }}"
                    matTooltipPosition="above"
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
        <div *ngIf="(produtosFiltrados$ | async) as produtosFiltrados; else semProdutos">
          <div *ngIf="produtosFiltrados.length === 0" class="empty-state">
            <lucide-icon name="package" />
            <h3>
              {{
                (produtos$ | async)?.length === 0
                  ? 'Nenhum produto cadastrado'
                  : 'Nenhum produto encontrado para "' + termoBusca + '"'
              }}
            </h3>
            <button
              *ngIf="(produtos$ | async)?.length === 0"
              mat-raised-button
              (click)="criarNovoProduto()"
            >
              <lucide-icon name="plus" />
              Cadastrar Primeiro Produto
            </button>
          </div>
        </div>
        <ng-template #semProdutos>
          <div class="empty-state" role="status">
            <p>Carregando produtos...</p>
          </div>
        </ng-template>
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

      .mat-mdc-tooltip {
        transform: translateY(14px) !important;
      }

      @media (max-width: 768px) {
        .produtos-page .produtos-busca {
          max-width: none;
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AdminProdutosComponent implements OnInit, OnDestroy {
  termoBusca: string = '';
  displayedColumns: string[] = ['nome', 'preco', 'estoque', 'acoes'];
  private routeSubscription?: Subscription;
  
  // Observable com todos os produtos
  produtos$!: Observable<Produto[]>;
  // Observable filtrado baseado no termo de busca
  produtosFiltrados$!: Observable<Produto[]>;

  constructor(
    private produtoService: ProdutoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();

    // Recarregar produtos quando voltar para a página
    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/admin/produtos') {
          this.carregarProdutos();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private carregarProdutos(): void {
    this.produtos$ = this.produtoService.obterTodosProdutos().pipe(
      catchError((error) => {
        console.error('Erro ao carregar produtos:', error);
        this.snackBar.open('Erro ao carregar produtos', 'Fechar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return of([]);
      }),
      shareReplay(1),
    );

    this.produtosFiltrados$ = this.produtos$.pipe(
      map((produtos) => 
        !this.termoBusca.trim()
          ? produtos
          : produtos.filter((produto) =>
              produto.nome.toLowerCase().includes(this.termoBusca.toLowerCase()),
            ),
      ),
      shareReplay(1),
    );
  }

  filtrarProdutos(): void {
    // Recarregar observables com novo termo de busca
    this.carregarProdutos();
  }

  editarProduto(produto: Produto): void {
    this.router.navigate(['/admin/produtos', produto.id, 'editar']);
  }

  criarNovoProduto(): void {
    this.router.navigate(['/admin/produtos/novo']);
  }

  verDetalhes(produtoId: string): void {
    // Navegar para página de detalhes (implementar futuramente)
    this.router.navigate(['/admin/produtos', produtoId]);
  }

  formatarMoeda(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  toggleStatusProduto(produto: Produto): void {
    const acao = produto.ativo ? 'desativar' : 'ativar';
    const dialogData: ConfirmDialogData = {
      title: `${acao.charAt(0).toUpperCase() + acao.slice(1)} Produto`,
      message: `Tem certeza que deseja ${acao} o produto "${produto.nome}"?`,
      confirmText: acao.charAt(0).toUpperCase() + acao.slice(1),
      cancelText: 'Cancelar',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.produtoService.atualizarProduto(produto.id!, { ativo: !produto.ativo }).subscribe({
          next: () => {
            this.snackBar.open(
              `Produto ${!produto.ativo ? 'ativado' : 'desativado'} com sucesso`,
              'Fechar',
              { 
                duration: 3000,
                panelClass: ['success-snackbar']
              },
            );
            // Recarregar produtos para manter sincronizado
            this.carregarProdutos();
          },
          error: (error) => {
            console.error(`Erro ao ${acao} produto:`, error);
            this.snackBar.open(`Erro ao ${acao} produto`, 'Fechar', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          },
        });
      }
    });
  }
}
