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
    <div style="padding: 24px;">
      <!-- Header com navegação -->
      <ng-container *ngIf="produto$ | async as produto">
        <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
          <button mat-icon-button (click)="voltar()" matTooltip="Voltar">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div style="display: flex; align-items: center; gap: 12px;">
            <mat-icon style="color: #556b2f; font-size: 32px; width: 32px; height: 32px;"
              >restaurant_menu</mat-icon
            >
            <h1 style="margin: 0; color: #556b2f; font-weight: 500; font-size: 28px;">
              {{ produto.nome }}
            </h1>
            <mat-chip
              *ngIf="!produto.ativo"
              style="background-color: #ff5722; color: white;"
            >
              INATIVO
            </mat-chip>
          </div>
        </div>
      </ng-container>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" *ngIf="produto$ | async as produto">
        <!-- Informações básicas do produto -->
        <mat-card>
          <mat-card-header style="margin-bottom: 16px;">
            <mat-card-title style="color: #556b2f;">
              <mat-icon>info</mat-icon>
              Informações do Produto
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Nome:</label
                >
                <span style="font-size: 18px; color: #333;">{{ produto.nome }}</span>
              </div>
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Preço:</label
                >
                <span style="font-size: 24px; font-weight: 600; color: #556b2f;">
                  R$ {{ formatarMoeda(produto.preco) }}
                </span>
              </div>
              <div>
                <label style="font-weight: 500; color: #666; display: block; margin-bottom: 4px;"
                  >Status:</label
                >
                <mat-chip
                  [style.background-color]="produto.ativo ? '#4caf50' : '#ff5722'"
                  style="color: white;"
                >
                  {{ produto.ativo ? 'ATIVO' : 'INATIVO' }}
                </mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Estatísticas do produto -->
        <mat-card>
          <mat-card-header style="margin-bottom: 16px;">
            <mat-card-title style="color: #556b2f;">
              <mat-icon>analytics</mat-icon>
              Estatísticas de Vendas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  {{ (estatisticas$ | async)?.totalVendido || 0 }}
                </div>
                <div style="color: #666; font-size: 14px;">Total de Unidades Vendidas</div>
              </div>
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  R$ {{ formatarMoeda((estatisticas$ | async)?.receitaTotal || 0) }}
                </div>
                <div style="color: #666; font-size: 14px;">Receita Total Gerada</div>
              </div>
              <div
                style="text-align: center; padding: 16px; background-color: #f5f5f5; border-radius: 8px;"
              >
                <div style="font-size: 32px; font-weight: 600; color: #556b2f;">
                  {{ (estatisticas$ | async)?.comandasComProduto || 0 }}
                </div>
                <div style="color: #666; font-size: 14px;">Comandas que Incluíram</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Ações do produto -->
      <div style="margin-top: 24px; display: flex; gap: 16px;" *ngIf="produto$ | async as produto">
        <button
          mat-raised-button
          style="background-color: #556b2f; color: white;"
          (click)="editarProduto(produto)"
        >
          <mat-icon>edit</mat-icon>
          Editar Produto
        </button>
        <button
          mat-raised-button
          [style.background-color]="produto.ativo ? '#ff5722' : '#4caf50'"
          style="color: white;"
          (click)="toggleStatus(produto)"
        >
          <mat-icon>{{ produto.ativo ? 'toggle_off' : 'toggle_on' }}</mat-icon>
          {{ produto.ativo ? 'Desativar' : 'Ativar' }} Produto
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="!(produto$ | async)" style="text-align: center; padding: 48px;">
        <mat-icon
          style="font-size: 64px; width: 64px; height: 64px; color: #ddd; animation: spin 1s linear infinite;"
          >sync</mat-icon
        >
        <p style="margin: 16px 0; color: #666;">Carregando informações do produto...</p>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      mat-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
