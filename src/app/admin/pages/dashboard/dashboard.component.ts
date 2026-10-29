import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { of } from 'rxjs';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, LucideAngularModule, MatCardModule, MatSnackBarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  comandas$!: Observable<Comanda[]>;
  comandasAbertas$!: Observable<Comanda[]>;
  comandasEncerradas$!: Observable<Comanda[]>;
  totalAbertas$!: Observable<number>;
  totalEncerradas$!: Observable<number>;
  totalReceita$!: Observable<number>;

  constructor(
    private comandaService: ComandaService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.comandas$ = this.comandaService.obterComandasCompletas().pipe(
      catchError((error) => {
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
      map((comandas) => comandas.filter((c) => c.status === 'ENCERRADA' || c.status === 'PAGA')),
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

    this.totalReceita$ = this.comandasEncerradas$.pipe(
      map((comandas) => comandas.reduce((total, comanda) => total + comanda.valorTotal, 0)),
      shareReplay(1),
    );
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  visualizarComanda(id: string): void {
    this.router.navigate(['/admin/comandas', id]);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  formatarData(data: Date | string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  }
}
