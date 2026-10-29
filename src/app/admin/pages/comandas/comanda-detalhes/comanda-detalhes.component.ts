import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda, ItemComanda, Produto } from '../../../../shared/models/api.interfaces';
import { ComandaService } from '../../../../core/services/comanda.service';
import { ProdutoService } from '../../../../core/services/produto.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

@Component({
  selector: 'app-comanda-detalhes',
  imports: [
    CurrencyPipe,
    DatePipe,
    LowerCasePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    LucideAngularModule,
  ],
  templateUrl: './comanda-detalhes.component.html',
  styleUrl: './comanda-detalhes.component.scss',
})
export class ComandaDetalhesComponent {
  private router = inject(Router);
  private comandaService = inject(ComandaService);
  private notificacao = inject(NotificacaoService);
  private readonly comandaId: string = inject(ActivatedRoute).snapshot.params['id'];

  readonly displayedColumns = ['quantidade', 'nome', 'valorUnitario', 'valorTotal'];

  // undefined = carregando, null = não encontrada
  readonly comanda = signal<Comanda | null | undefined>(undefined);
  readonly itens = signal<ItemComanda[] | undefined>(undefined);

  readonly produtoBuscaControl = new FormControl<string | Produto>('', { nonNullable: true });
  readonly produtoSelecionado = signal<Produto | null>(null);
  readonly adicionandoProduto = signal(false);

  private readonly produtos = toSignal(
    inject(ProdutoService)
      .obterProdutosAtivos()
      .pipe(
        map((produtos) => [...produtos].sort((a, b) => a.nome.localeCompare(b.nome))),
        catchError((error) => {
          console.error('Erro ao carregar produtos:', error);
          this.notificacao.erro('Erro ao carregar produtos para adicionar');
          return of([]);
        }),
      ),
  );
  private readonly busca = toSignal(this.produtoBuscaControl.valueChanges, { initialValue: '' });

  readonly produtosFiltrados = computed(() => {
    const produtos = this.produtos();
    if (!produtos) return undefined;

    const valorBusca = this.busca();
    const termo = normalizarTexto(typeof valorBusca === 'string' ? valorBusca : valorBusca.nome);
    if (!termo) {
      return produtos.slice(0, 10);
    }
    return produtos.filter((produto) => normalizarTexto(produto.nome).includes(termo));
  });

  constructor() {
    this.carregarComanda();
    this.carregarItens();
  }

  displayProduto = (produto: Produto | string | null): string =>
    !produto ? '' : typeof produto === 'string' ? produto : produto.nome;

  onProdutoDigitado(): void {
    if (typeof this.produtoBuscaControl.value === 'string') {
      this.produtoSelecionado.set(null);
    }
  }

  adicionarProdutoSelecionado(comandaId: string): void {
    const produto = this.produtoSelecionado();
    if (!produto || this.adicionandoProduto()) {
      this.notificacao.erro('Selecione um produto para adicionar', { acao: 'OK', duracao: 2000 });
      return;
    }

    this.definirAdicionando(true);

    // Produto já na comanda: soma 1 na quantidade do item existente
    const itemExistente = this.itens()?.find((item) => item.produtoId === produto.id);
    const operacao: Observable<unknown> = itemExistente
      ? this.comandaService.atualizarQuantidadeItemAdmin(itemExistente.id, itemExistente.quantidade + 1)
      : this.comandaService.adicionarItemAdmin(comandaId, produto.id, 1);

    operacao.subscribe({
      next: () => {
        this.definirAdicionando(false);
        this.produtoSelecionado.set(null);
        this.produtoBuscaControl.setValue('');
        this.notificacao.sucesso(`${produto.nome} adicionado à comanda!`, { acao: 'OK', duracao: 2000 });
        this.carregarItens();
      },
      error: () => {
        this.definirAdicionando(false);
        this.notificacao.erro('Erro ao adicionar produto na comanda', { acao: 'OK', duracao: 2500 });
      },
    });
  }

  encerrarComanda(): void {
    this.executarAcaoComanda(
      { title: 'Encerrar Comanda', message: 'Tem certeza que deseja encerrar esta comanda?', confirmText: 'Encerrar' },
      (id) => this.comandaService.encerrarComandaAdmin(id),
      'Comanda encerrada com sucesso!',
      'Erro ao encerrar comanda',
    );
  }

  confirmarPagamento(): void {
    this.executarAcaoComanda(
      { title: 'Confirmar Pagamento', message: 'Tem certeza que deseja confirmar o pagamento?', confirmText: 'Confirmar' },
      (id) => this.comandaService.confirmarPagamentoAdmin(id),
      'Pagamento confirmado com sucesso!',
      'Erro ao confirmar pagamento',
    );
  }

  voltar(): void {
    this.router.navigate(['/admin/comandas']);
  }

  aumentarQuantidade(item: ItemComanda): void {
    this.alterarQuantidade(item, item.quantidade + 1);
  }

  diminuirQuantidade(item: ItemComanda): void {
    if (item.quantidade > 1) {
      this.alterarQuantidade(item, item.quantidade - 1);
      return;
    }

    this.notificacao
      .confirmar({
        title: 'Remover Item',
        message: 'Deseja remover este item da comanda?',
        confirmText: 'Remover',
        cancelText: 'Cancelar',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.comandaService.removerItemAdmin(item.id).subscribe({
          next: () => {
            this.notificacao.sucesso('Item removido!', { acao: 'OK', duracao: 2000 });
            this.carregarItens();
          },
          error: () => this.notificacao.erro('Erro ao remover item', { acao: 'OK' }),
        });
      });
  }

  private alterarQuantidade(item: ItemComanda, quantidade: number): void {
    this.comandaService.atualizarQuantidadeItemAdmin(item.id, quantidade).subscribe({
      next: () => {
        this.notificacao.sucesso('Quantidade atualizada!', { acao: 'OK', duracao: 1500 });
        this.carregarItens();
      },
      error: () => this.notificacao.erro('Erro ao atualizar quantidade', { acao: 'OK', duracao: 2000 }),
    });
  }

  /**
   * Confirma com o usuário, executa a ação na comanda e recarrega os dados
   */
  private executarAcaoComanda(
    dialogo: { title: string; message: string; confirmText: string },
    acao: (comandaId: string) => Observable<void>,
    mensagemSucesso: string,
    mensagemErro: string,
  ): void {
    const comanda = this.comanda();
    if (!comanda) return;

    this.notificacao.confirmar({ ...dialogo, cancelText: 'Cancelar' }).subscribe((confirmado) => {
      if (!confirmado) return;
      acao(comanda.id).subscribe({
        next: () => {
          this.notificacao.sucesso(mensagemSucesso);
          this.carregarComanda();
          this.carregarItens();
        },
        error: (error) => {
          console.error(`${mensagemErro}:`, error);
          this.notificacao.erro(mensagemErro);
        },
      });
    });
  }

  private carregarComanda(): void {
    this.comandaService.obterComanda(this.comandaId).subscribe({
      next: (comanda) => this.comanda.set(comanda),
      error: (error) => {
        console.error('Erro ao carregar comanda:', error);
        this.notificacao.erro('Erro ao carregar comanda');
        this.comanda.set(null);
      },
    });
  }

  private carregarItens(): void {
    this.comandaService.obterItensComanda(this.comandaId).subscribe({
      next: (itens) => this.itens.set(itens),
      error: (error) => {
        console.error('Erro ao carregar itens:', error);
        this.notificacao.erro('Erro ao carregar itens da comanda');
        this.itens.set([]);
      },
    });
  }

  private definirAdicionando(adicionando: boolean): void {
    this.adicionandoProduto.set(adicionando);
    if (adicionando) {
      this.produtoBuscaControl.disable();
    } else {
      this.produtoBuscaControl.enable();
    }
  }
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
