import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule } from 'lucide-angular';
import { ComandaService } from '../../../core/services/comanda.service';

@Component({
  selector: 'app-encerrada',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, LucideAngularModule],
  templateUrl: './encerrada.component.html',
  styleUrl: './encerrada.component.scss',
})
export class EncerradaComponent {
  private comandaService = inject(ComandaService);
  private router = inject(Router);

  readonly comandaAtual = this.comandaService.comandaAtual;

  novaComanda(): void {
    // Garantir que todos os dados da sessão anterior sejam limpos
    this.comandaService.limparSessaoComanda();
    this.router.navigate(['/start']);
  }
}
