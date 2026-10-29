import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { Produto } from '../../../shared/models/api.interfaces';
import { ProdutoService } from '../../../core/services/produto.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterNavComponent } from '../../../shared/components/footer-nav/footer-nav.component';

const TODAS_CATEGORIAS = 'TODOS';

@Component({
  selector: 'app-cardapio',
  imports: [CurrencyPipe, MatButtonModule, LucideAngularModule, HeaderComponent, FooterNavComponent],
  templateUrl: './cardapio.component.html',
  styleUrl: './cardapio.component.scss',
})
export class CardapioComponent {
  private produtoService = inject(ProdutoService);
  private comandaService = inject(ComandaService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly nomeUsuario = inject(LocalStorageService).getUserData()?.nomeCliente || 'Cliente';
  readonly comandaAtual = this.comandaService.comandaAtual;
  readonly totalItens = this.comandaService.totalItens;

  readonly busca = signal('');
  readonly categoriaSelecionada = signal(TODAS_CATEGORIAS);

  // undefined enquanto carrega
  private readonly produtos = toSignal(
    this.produtoService.obterProdutosAtivos().pipe(
      map((produtos) => [...produtos].sort((a, b) => a.nome.localeCompare(b.nome))),
      catchError((error) => {
        console.error('Erro ao carregar produtos:', error);
        return EMPTY;
      }),
    ),
  );

  readonly categorias = computed(() =>
    Array.from(new Set((this.produtos() ?? []).map((p) => p.categoria).filter((c) => c))).sort(),
  );

  readonly produtosFiltrados = computed(() => {
    const produtos = this.produtos();
    if (!produtos) return undefined;

    const categoria = this.categoriaSelecionada();
    const busca = this.busca();
    const termo = removerAcentos(busca);

    return produtos.filter(
      (p) =>
        (categoria === TODAS_CATEGORIAS || p.categoria === categoria) &&
        (!busca.trim() || removerAcentos(p.nome).includes(termo)),
    );
  });

  constructor() {
    // Garantir que a comanda esteja carregada
    this.comandaService.garantirComandaAtiva().subscribe({
      error: (error) => {
        console.error('Erro ao carregar comanda ativa:', error);
        this.router.navigate(['/start']);
      },
    });
  }

  adicionarProduto(produto: Produto): void {
    this.comandaService.adicionarItem(produto.id, 1).subscribe({
      next: () => {
        this.notificacao
          .sucesso(`✓ ${produto.nome} adicionado à comanda!`, { acao: 'Ver Comanda' })
          .onAction()
          .subscribe(() => this.router.navigate(['/carrinho']));
      },
      error: (error) => {
        console.error('Erro ao adicionar produto:', error);
        this.notificacao.erro('❌ Erro ao adicionar produto', { acao: 'Tentar Novamente' });
      },
    });
  }

  onNavClick(route: string): void {
    this.router.navigate([`/${route}`]);
  }

  selecionarCategoria(categoria: string): void {
    // Sem aba "TODOS": tocar na categoria ativa remove o filtro e volta a mostrar tudo
    this.categoriaSelecionada.update((atual) =>
      atual === categoria ? TODAS_CATEGORIAS : categoria,
    );
  }
}

function removerAcentos(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
