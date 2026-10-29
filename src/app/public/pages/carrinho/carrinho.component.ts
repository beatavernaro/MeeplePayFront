import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule } from 'lucide-angular';
import { ItemComanda } from '../../../shared/models/api.interfaces';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterNavComponent } from '../../../shared/components/footer-nav/footer-nav.component';

@Component({
  selector: 'app-carrinho',
  imports: [CurrencyPipe, MatButtonModule, LucideAngularModule, HeaderComponent, FooterNavComponent],
  templateUrl: './carrinho.component.html',
  styleUrl: './carrinho.component.scss',
})
export class CarrinhoComponent {
  private comandaService = inject(ComandaService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly encerrando = signal(false);
  readonly itens = this.comandaService.itens;
  readonly comandaAtual = this.comandaService.comandaAtual;
  readonly totalItens = this.comandaService.totalItens;

  voltarCardapio(): void {
    this.router.navigate(['/cardapio']);
  }

  encerrarComanda(): void {
    this.notificacao
      .confirmar({
        title: 'Encerrar Comanda',
        message:
          'Depois de encerrada, não será possível adicionar novos itens. Deseja continuar?',
        confirmText: 'Encerrar',
        cancelText: 'Voltar',
      })
      .subscribe((confirmado) => {
        if (!confirmado || this.encerrando()) return;
        this.encerrando.set(true);
        this.comandaService.encerrarComanda().subscribe({
          next: () => this.router.navigate(['/encerrada']),
          error: (error: HttpErrorResponse) => {
            console.error('Erro ao encerrar comanda:', error);
            this.encerrando.set(false);
            // Regras do backend (ex.: comanda já encerrada pelo caixa) vêm em { message }
            const mensagem =
              error.status === 400 && typeof error.error?.message === 'string'
                ? error.error.message
                : 'Erro ao encerrar a comanda. Tente novamente.';
            this.notificacao.erro(mensagem, { duracao: 5000 });
          },
        });
      });
  }

  aumentarQuantidade(item: ItemComanda): void {
    this.comandaService.aumentarQuantidade(item.id).subscribe({
      next: () => this.notificacao.sucesso('Quantidade atualizada!', { acao: 'OK', duracao: 1500 }),
      error: () => this.notificacao.erro('Erro ao atualizar quantidade', { acao: 'OK', duracao: 2000 }),
    });
  }

  diminuirQuantidade(item: ItemComanda): void {
    if (item.quantidade > 1) {
      this.comandaService.diminuirQuantidade(item.id).subscribe({
        next: () => this.notificacao.sucesso('Quantidade atualizada!', { acao: 'OK', duracao: 1500 }),
        error: () => this.notificacao.erro('Erro ao atualizar quantidade', { acao: 'OK', duracao: 2000 }),
      });
      return;
    }

    // Último item: confirma a remoção
    this.notificacao
      .confirmar({
        title: 'Remover Item',
        message: `Deseja remover "${item.nome}" da comanda?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.comandaService.removerItem(item.id).subscribe({
          next: () => this.notificacao.sucesso('Item removido!', { acao: 'OK', duracao: 2000 }),
          error: () => this.notificacao.erro('Erro ao remover item', { acao: 'OK' }),
        });
      });
  }

  onNavClick(route: string): void {
    this.router.navigate([`/${route}`]);
  }
}
