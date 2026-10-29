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

@Component({
  selector: 'app-admin-produtos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div style="padding: 24px;">
      <!-- Header com título -->
      <div
        style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;"
      >
        <div style="display: flex; align-items: center; gap: 12px;">
          <mat-icon style="color: #556b2f; font-size: 32px; width: 32px; height: 32px;"
            >inventory</mat-icon
          >
          <h1 style="margin: 0; color: #556b2f; font-weight: 500; font-size: 28px;">
            Gerenciamento de Produtos
          </h1>
        </div>
        <button
          mat-raised-button
          style="background-color: #556b2f; color: white;"
          (click)="criarNovoProduto()"
        >
          <mat-icon>add</mat-icon>
          Novo Produto
        </button>
      </div>

      <!-- Barra de pesquisa -->
      <div style="margin-bottom: 24px;">
        <mat-form-field style="width: 400px;" appearance="outline">
          <mat-label>Buscar produtos</mat-label>
          <input
            matInput
            [(ngModel)]="termoBusca"
            (ngModelChange)="filtrarProdutos()"
            placeholder="Digite o nome do produto..."
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Tabela de produtos -->
      <div
        style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
      >
        <table mat-table [dataSource]="(produtosFiltrados$ | async) || []" style="width: 100%;">
          <!-- Coluna Nome -->
          <ng-container matColumnDef="nome">
            <th
              mat-header-cell
              *matHeaderCellDef
              style="background-color: #f5f5f5; font-weight: 600; padding: 16px;"
            >
              Nome do Produto
            </th>
            <td mat-cell *matCellDef="let produto" style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <mat-icon
                  *ngIf="produto.estoque <= 0; else iconeProduto"
                  style="color: #ff9800;"
                  matTooltip="Produto sem estoque"
                  matTooltipPosition="above"
                  >warning</mat-icon
                >
                <ng-template #iconeProduto>
                  <mat-icon style="color: #556b2f;">restaurant_menu</mat-icon>
                </ng-template>
                <span style="font-weight: 500;">{{ produto.nome }}</span>
                <span
                  *ngIf="!produto.ativo"
                  style="background-color: #ff5722; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;"
                >
                  INATIVO
                </span>
              </div>
            </td>
          </ng-container>

          <!-- Coluna Valor Unitário -->
          <ng-container matColumnDef="preco">
            <th
              mat-header-cell
              *matHeaderCellDef
              style="background-color: #f5f5f5; font-weight: 600; padding: 16px;"
            >
              Valor Unitário
            </th>
            <td mat-cell *matCellDef="let produto" style="padding: 16px;">
              <span style="font-weight: 500; color: #556b2f; font-size: 16px;">
                R$ {{ formatarMoeda(produto.preco) }}
              </span>
            </td>
          </ng-container>

          <!-- Coluna Estoque -->
          <ng-container matColumnDef="estoque">
            <th
              mat-header-cell
              *matHeaderCellDef
              style="background-color: #f5f5f5; font-weight: 600; padding: 16px;"
            >
              Estoque
            </th>
            <td mat-cell *matCellDef="let produto" style="padding: 16px;">
              <span
                style="font-weight: 500; font-size: 16px;"
                [style.color]="produto.estoque <= 0 ? '#ff5722' : '#333'"
              >
                {{ produto.estoque }}
              </span>
            </td>
          </ng-container>

          <!-- Coluna Ações -->
          <ng-container matColumnDef="acoes">
            <th
              mat-header-cell
              *matHeaderCellDef
              style="background-color: #f5f5f5; font-weight: 600; padding: 16px; text-align: center;"
            >
              Ações
            </th>
            <td mat-cell *matCellDef="let produto" style="padding: 16px; text-align: center;">
              <div style="display: flex; gap: 8px; justify-content: center;">
                <button
                  mat-icon-button
                  matTooltip="Editar produto"
                  matTooltipPosition="above"
                  matTooltipShowDelay="300"
                  (click)="editarProduto(produto)"
                  style="color: #2196f3;"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Detalhes do produto"
                  matTooltipPosition="above"
                  matTooltipShowDelay="300"
                  (click)="verDetalhes(produto.id!)"
                  style="color: #556b2f;"
                >
                  <mat-icon>visibility</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="{{ produto.ativo ? 'Desativar produto' : 'Ativar produto' }}"
                  matTooltipPosition="above"
                  (click)="toggleStatusProduto(produto)"
                  [style.color]="produto.ativo ? '#ff5722' : '#4caf50'"
                >
                  <mat-icon>{{ produto.ativo ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        <!-- Mensagem quando não há produtos -->
        <div
          *ngIf="(produtosFiltrados$ | async) as produtosFiltrados; else semProdutos"
        >
          <div
            *ngIf="produtosFiltrados.length === 0"
            style="padding: 48px; text-align: center; color: #666;"
          >
            <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: #ddd;"
              >inventory</mat-icon
            >
            <p style="margin: 16px 0; font-size: 18px;">
              {{
                (produtos$ | async)?.length === 0
                  ? 'Nenhum produto cadastrado'
                  : 'Nenhum produto encontrado para "' + termoBusca + '"'
              }}
            </p>
            <button
              *ngIf="(produtos$ | async)?.length === 0"
              mat-raised-button
              style="background-color: #556b2f; color: white;"
              (click)="criarNovoProduto()"
            >
              <mat-icon>add</mat-icon>
              Cadastrar Primeiro Produto
            </button>
          </div>
        </div>
        <ng-template #semProdutos>
          <div style="padding: 48px; text-align: center; color: #666;">
            <p>Carregando produtos...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      table {
        background-color: white;
      }

      .mat-mdc-row:hover {
        background-color: #f9f9f9;
      }

      .mat-mdc-header-row {
        background-color: #f5f5f5;
      }

      .mat-mdc-tooltip {
        transform: translateY(14px) !important;
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
