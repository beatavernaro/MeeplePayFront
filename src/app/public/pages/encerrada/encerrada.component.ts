import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../../environments/environment';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

@Component({
  selector: 'app-encerrada',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, LucideAngularModule],
  templateUrl: './encerrada.component.html',
  styleUrl: './encerrada.component.scss',
})
export class EncerradaComponent {
  private comandaService = inject(ComandaService);
  private clipboard = inject(Clipboard);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly comandaAtual = this.comandaService.comandaAtual;
  readonly pix = environment.pix;
  readonly chaveCopiada = signal(false);

  constructor() {
    // Ao recarregar a página, recupera a comanda da sessão salva para mostrar o pagamento
    this.comandaService.restaurarSessao().subscribe();
  }

  copiarChavePix(): void {
    if (this.clipboard.copy(this.pix.chave)) {
      this.chaveCopiada.set(true);
      this.notificacao.sucesso('Chave Pix copiada!', { duracao: 2000 });
    } else {
      this.notificacao.erro('Não foi possível copiar. Selecione a chave e copie manualmente.');
    }
  }

  novaComanda(): void {
    // Garantir que todos os dados da sessão anterior sejam limpos
    this.comandaService.limparSessaoComanda();
    this.router.navigate(['/start']);
  }
}
