import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { switchMap, map, catchError, shareReplay, startWith, take } from 'rxjs/operators';
import { Comanda } from '../../../../shared/models/comanda.model';
import { ItemComanda } from '../../../../shared/models/item-comanda.model';
import { Produto } from '../../../../shared/models/produto.model';
import { ComandaService } from '../../../../core/services/comanda.service';
import { ProdutoService } from '../../../../core/services/produto.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-comanda-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  templateUrl: './comanda-detalhes.component.html',
  styleUrl: './comanda-detalhes.component.scss',
})
export class ComandaDetalhesComponent implements OnInit {
  comanda$!: Observable<Comanda | null>;
  itens$!: Observable<ItemComanda[]>;
  produtos$!: Observable<Produto[]>;
  produtosFiltrados$!: Observable<Produto[]>;
  displayedColumns: string[] = ['quantidade', 'nome', 'valorUnitario', 'valorTotal'];
  produtoBuscaControl = new FormControl<string | Produto>('');
  produtoSelecionado: Produto | null = null;
  adicionandoProduto = false;
  private comandaId: string | null = null;
  private itensRefresh$ = new BehaviorSubject<void>(undefined);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comandaService: ComandaService,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    const comandaId = this.route.snapshot.params['id'] as string | undefined;
    if (comandaId) {
      this.comandaId = comandaId;
      this.carregarDadosComanda(comandaId);
    }

    this.inicializarBuscaProdutos();
  }

  private carregarDadosComanda(comandaId: string): void {
    this.comanda$ = this.comandaService.buscarComanda(comandaId).pipe(
      catchError((error) => {
        console.error('Erro ao carregar comanda:', error);
        this.snackBar.open('Erro ao carregar comanda', 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return of(null);
      }),
      shareReplay(1),
    );

    this.itens$ = this.itensRefresh$.pipe(
      switchMap(() => this.comandaService.obterItensComanda(comandaId).pipe(
        catchError((error) => {
          console.error('Erro ao carregar itens:', error);
          this.snackBar.open('Erro ao carregar itens da comanda', 'Fechar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of([]);
        }),
      )),
      shareReplay(1),
    );
  }

  private inicializarBuscaProdutos(): void {
    this.produtos$ = this.produtoService.obterProdutosAtivos().pipe(
      map((produtos) => produtos.sort((a, b) => a.nome.localeCompare(b.nome))),
      catchError((error) => {
        console.error('Erro ao carregar produtos:', error);
        this.snackBar.open('Erro ao carregar produtos para adicionar', 'Fechar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return of([]);
      }),
      shareReplay(1),
    );

    this.produtosFiltrados$ = combineLatest([
      this.produtos$,
      this.produtoBuscaControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([produtos, valorBusca]) => {
        const termoBusca = this.normalizarTexto(
          typeof valorBusca === 'string' ? valorBusca : (valorBusca?.nome || ''),
        );

        if (!termoBusca) {
          return produtos.slice(0, 10);
        }

        return produtos.filter((produto) =>
          this.normalizarTexto(produto.nome).includes(termoBusca),
        );
      }),
      shareReplay(1),
    );
  }

  displayProduto(produto: Produto | string | null): string {
    if (!produto) {
      return '';
    }
    return typeof produto === 'string' ? produto : produto.nome;
  }

  onProdutoDigitado(): void {
    if (typeof this.produtoBuscaControl.value === 'string') {
      this.produtoSelecionado = null;
    }
  }

  onProdutoSelecionado(produto: Produto): void {
    this.produtoSelecionado = produto;
  }

  adicionarProdutoSelecionado(comandaId: string): void {
    if (!this.produtoSelecionado?.id || this.adicionandoProduto) {
      this.snackBar.open('Selecione um produto para adicionar', 'OK', {
        duration: 2000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.adicionandoProduto = true;
    const produto = this.produtoSelecionado;

    this.itens$.pipe(
      take(1),
      switchMap((itens) => {
        const itemExistente = itens.find(
          item => item.produtoId === produto.id
        );

        if (itemExistente?.id) {
          return this.comandaService.atualizarQuantidadeItemAdmin(
            itemExistente.id,
            itemExistente.quantidade + 1,
          );
        }

        return this.comandaService.adicionarItemAdmin(
          comandaId,
          produto.id!,
          1
        );
      })
    ).subscribe({
      next: () => {
        this.adicionandoProduto = false;
        this.produtoSelecionado = null;
        this.produtoBuscaControl.setValue('');

        this.snackBar.open(`${produto.nome} adicionado à comanda!`, 'OK', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });

        this.itensRefresh$.next();
      },
      error: () => {
        this.adicionandoProduto = false;

        this.snackBar.open('Erro ao adicionar produto na comanda', 'OK', {
          duration: 2500,
          panelClass: ['error-snackbar']
        });
      },
    });
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  encerrarComanda(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Encerrar Comanda',
        message: 'Tem certeza que deseja encerrar esta comanda?',
        confirmText: 'Encerrar',
        cancelText: 'Cancelar',
      },
    });


    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.comanda$.pipe(
          switchMap((comanda) => {
            if (!comanda) {
              return of(null);
            }
            return this.comandaService.encerrarComandaAdmin(comanda.id);
          }),
          catchError((error) => {
            console.error('Erro ao encerrar comanda:', error);
            this.snackBar.open('Erro ao encerrar comanda', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
            return of(null);
          }),
        ).subscribe((result) => {
          location.reload();
          if (result !== null) {
            this.snackBar.open('Comanda encerrada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          }
        });
      }
    });
  }

  confirmarPagamento(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Pagamento',
        message: 'Tem certeza que deseja confirmar o pagamento?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
      },
    });


    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.comanda$.pipe(
          switchMap((comanda) => {
            if (!comanda) {
              return of(null);
            }
            return this.comandaService.confirmarPagamentoAdmin(comanda.id);
          }),
          catchError((error) => {
            console.error('Erro ao confirmar pagamento:', error);
            this.snackBar.open('Erro ao confirmar pagamento', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
            return of(null);
          }),
        ).subscribe((result) => {
          location.reload();
          if (result !== null) {
            this.snackBar.open('Pagamento confirmado com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          }
        });
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/admin/comandas']);
  }

  trackByItemId(index: number, item: ItemComanda): string {
    return item.id || index.toString();
  }

  aumentarQuantidade(item: ItemComanda): void {
    if (item.id) {
      this.comandaService.atualizarQuantidadeItemAdmin(item.id, item.quantidade + 1).subscribe({
        next: () => {
          this.snackBar.open('Quantidade atualizada!', 'OK', {
            duration: 1500,
            panelClass: ['success-snackbar']
          });
          this.itensRefresh$.next();
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar quantidade', 'OK', {
            duration: 2000,
            panelClass: ['error-snackbar']
          });
        },
      });
    }
  }

  diminuirQuantidade(item: ItemComanda): void {
    if (item.id) {
      if (item.quantidade === 1) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Remover Item',
            message: 'Deseja remover este item da comanda?',
            confirmText: 'Remover',
            cancelText: 'Cancelar',
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result && item.id) {
            this.comandaService.removerItemAdmin(item.id).subscribe({
              next: () => {
                this.snackBar.open('Item removido!', 'OK', {
                  duration: 2000,
                  panelClass: ['success-snackbar']
                });
                this.itensRefresh$.next();
              },
              error: () => {
                this.snackBar.open('Erro ao remover item', 'OK', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              },
            });
          }
        });
      } else {
        this.comandaService.atualizarQuantidadeItemAdmin(item.id, item.quantidade - 1).subscribe({
          next: () => {
            this.snackBar.open('Quantidade atualizada!', 'OK', {
              duration: 1500,
              panelClass: ['success-snackbar']
            });
            this.itensRefresh$.next();
          },
          error: () => {
            this.snackBar.open('Erro ao atualizar quantidade', 'OK', {
              duration: 2000,
              panelClass: ['error-snackbar']
            });
          },
        });
      }
    }
  }
}
