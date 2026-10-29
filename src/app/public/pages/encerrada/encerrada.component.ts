import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { Comanda } from '../../../shared/models/comanda.model';
import { ComandaService } from '../../../core/services/comanda.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-encerrada',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, LucideAngularModule, MatDividerModule],
  templateUrl: './encerrada.component.html',
  styleUrl: './encerrada.component.scss',
})
export class EncerradaComponent implements OnInit {
  comandaAtual$!: Observable<Comanda | null>;

  constructor(
    private comandaService: ComandaService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.comandaAtual$ = this.comandaService.comandaAtual$;
  }

  novaComanda(): void {
    // Garantir que todos os dados da sessão anterior sejam limpos
    this.comandaService.limparSessaoComanda();
    this.router.navigate(['/start']);
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
