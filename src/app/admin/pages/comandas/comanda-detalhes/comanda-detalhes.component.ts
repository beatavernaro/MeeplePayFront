import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { switchMap, map, catchError, shareReplay } from 'rxjs/operators';
import { of } from 'rxjs';
import { Comanda } from '../../../../shared/models/comanda.model';
import { ItemComanda } from '../../../../shared/models/item-comanda.model';
import { ComandaService } from '../../../../core/services/comanda.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-comanda-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './comanda-detalhes.component.html',
  styleUrl: './comanda-detalhes.component.scss',
})
export class ComandaDetalhesComponent implements OnInit {
  comanda$!: Observable<Comanda | null>;
  itens$!: Observable<ItemComanda[]>;
  displayedColumns: string[] = ['quantidade', 'nome', 'valorUnitario', 'valorTotal'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comandaService: ComandaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const comandaId = this.route.snapshot.params['id'];
    if (comandaId) {
      this.comanda$ = this.comandaService.obterComandasCompletas().pipe(
        map((comandas) => comandas.find((c) => c.id === comandaId) || null),
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

      this.itens$ = this.comanda$.pipe(
        switchMap((comanda) => {
          if (!comanda) {
            return of([]);
          }
          return this.comandaService.obterItensComanda(comanda.id).pipe(
            catchError((error) => {
              console.error('Erro ao carregar itens:', error);
              this.snackBar.open('Erro ao carregar itens da comanda', 'Fechar', { 
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              return of([]);
            }),
          );
        }),
        shareReplay(1),
      );
    }
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
          if (result !== null) {
            this.snackBar.open('Comanda encerrada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            setTimeout(() => location.reload(), 1500);
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
      this.comandaService.aumentarQuantidade(item.id).subscribe({
        next: () => {
          this.snackBar.open('Quantidade atualizada!', 'OK', { 
            duration: 1500,
            panelClass: ['success-snackbar']
          });
          setTimeout(() => location.reload(), 1000);
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
            this.comandaService.removerItem(item.id).subscribe({
              next: () => {
                this.snackBar.open('Item removido!', 'OK', { 
                  duration: 2000,
                  panelClass: ['success-snackbar']
                });
                setTimeout(() => location.reload(), 1000);
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
        this.comandaService.diminuirQuantidade(item.id).subscribe({
          next: () => {
            this.snackBar.open('Quantidade atualizada!', 'OK', { 
              duration: 1500,
              panelClass: ['success-snackbar']
            });
            setTimeout(() => location.reload(), 1000);
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
