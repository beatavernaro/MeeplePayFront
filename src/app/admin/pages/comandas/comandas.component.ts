import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { of } from 'rxjs';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-comandas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './comandas.component.html',
  styleUrl: './comandas.component.scss',
})
export class AdminComandasComponent implements OnInit {
  comandas$!: Observable<Comanda[]>;
  comandasAbertas$!: Observable<Comanda[]>;
  comandasEncerradas$!: Observable<Comanda[]>;
  totalAbertas$!: Observable<number>;
  totalEncerradas$!: Observable<number>;
  totalReceitaAbertas$!: Observable<number>;
  totalReceitaEncerradas$!: Observable<number>;

  displayedColumns: string[] = ['numero', 'nome', 'dataCriacao', 'status', 'total', 'acoes'];
  displayedColumnsEncerradas: string[] = ['numero', 'nome', 'dataCriacao', 'dataEncerramento', 'total', 'acoes'];

  constructor(
    private comandaService: ComandaService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.carregarComandas();
  }

  private carregarComandas(): void {
    this.comandas$ = this.comandaService.obterComandasCompletas().pipe(
      catchError((error) => {
        console.error('Erro ao carregar comandas:', error);
        this.snackBar.open('Erro ao carregar comandas. Tente novamente.', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        return of([]);
      }),
      shareReplay(1),
    );

    this.comandasAbertas$ = this.comandas$.pipe(
      map((comandas) => comandas.filter((c) => c.status === 'ABERTA')),
      shareReplay(1),
    );

    this.comandasEncerradas$ = this.comandas$.pipe(
      map((comandas) => comandas.filter((c) => c.status === 'ENCERRADA')),
      shareReplay(1),
    );

    this.totalAbertas$ = this.comandasAbertas$.pipe(
      map((comandas) => comandas.length),
      shareReplay(1),
    );

    this.totalEncerradas$ = this.comandasEncerradas$.pipe(
      map((comandas) => comandas.length),
      shareReplay(1),
    );

    this.totalReceitaAbertas$ = this.comandasAbertas$.pipe(
      map((comandas) => comandas.reduce((total, comanda) => total + comanda.valorTotal, 0)),
      shareReplay(1),
    );

    this.totalReceitaEncerradas$ = this.comandasEncerradas$.pipe(
      map((comandas) => comandas.reduce((total, comanda) => total + comanda.valorTotal, 0)),
      shareReplay(1),
    );
  }

  visualizarComanda(id: number): void {
    this.router.navigate(['/admin/comandas', id]);
  }

  encerrarComanda(comanda: Comanda): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Encerrar Comanda',
        message: `Tem certeza que deseja encerrar a comanda #${comanda.id}?`,
        confirmText: 'Encerrar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.comandaService.encerrarComandaAdmin(comanda.id).subscribe({
          next: () => {
            this.snackBar.open('Comanda encerrada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            this.carregarComandas();
          },
          error: (error: any) => {
            console.error('Erro ao encerrar comanda:', error);
            this.snackBar.open('Erro ao encerrar comanda', 'Fechar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  formatarData(data: Date | string | null): string {
    if (!data) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(data));
  }
}
