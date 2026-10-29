import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError, map, of, switchMap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from './local-storage.service';
import {
  Comanda,
  ItemComanda,
  CreateItemComandaRequest,
  UpdateItemComandaRequest,
  CreateComandaRequest,
  CreateComandaResponse,
} from '../../shared/models/api.interfaces';

/**
 * Chamadas da API de comandas e o estado da comanda do cliente (comanda atual e seus itens).
 * Erros 401/403 são tratados no AuthInterceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class ComandaService {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  private readonly comandaAtualState = signal<Comanda | null>(null);
  private readonly itensState = signal<ItemComanda[]>([]);

  readonly comandaAtual = this.comandaAtualState.asReadonly();
  readonly itens = this.itensState.asReadonly();
  readonly totalItens = computed(() =>
    this.itensState().reduce((total, item) => total + item.quantidade, 0),
  );

  constructor() {
    // Carregar comanda ativa na inicialização se existir
    const userData = this.localStorageService.getUserData();
    if (userData?.comandaId && userData.accessToken) {
      this.buscarComanda(userData.comandaId).subscribe({
        error: (error) => {
          console.error('Erro ao recarregar comanda:', error);
          this.localStorageService.clearUserData();
        },
      });
    }
  }

  // === COMANDA DO CLIENTE ===

  /**
   * Reconectar a uma comanda existente obtendo novo token
   */
  reconectarComanda(nomeCliente: string, celular: string): Observable<Comanda> {
    const dados: CreateComandaRequest = {
      nomeCliente: nomeCliente.trim(),
      celular: celular.trim(),
    };

    return this.http.post<CreateComandaResponse>(`${this.baseUrl}/comandas/reconectar`, dados).pipe(
      map((response) => {
        this.localStorageService.saveAccessToken(response.accessToken);
        return this.definirComandaAtual(response.comanda);
      }),
    );
  }

  /**
   * Criar nova comanda com dados do usuário
   */
  criarNovaComanda(nomeCliente: string, celular: string): Observable<Comanda> {
    const dados: CreateComandaRequest = {
      nomeCliente: nomeCliente.trim(),
      celular: celular.trim(),
    };

    return this.http.post<CreateComandaResponse>(`${this.baseUrl}/comandas`, dados).pipe(
      map((response) => {
        this.localStorageService.saveAccessToken(response.accessToken);
        const comanda = normalizarComanda(response.comanda);
        this.comandaAtualState.set(comanda);
        return comanda;
      }),
    );
  }

  /**
   * Buscar comanda por ID e carregá-la como comanda atual do cliente
   */
  buscarComanda(id: string): Observable<Comanda> {
    return this.obterComanda(id).pipe(tap((comanda) => this.definirComandaAtual(comanda)));
  }

  /**
   * Garantir que há uma comanda ativa - recarrega se necessário
   */
  garantirComandaAtiva(): Observable<Comanda> {
    const comandaAtual = this.comandaAtualState();
    if (comandaAtual) {
      return of(comandaAtual);
    }

    const userData = this.localStorageService.getUserData();
    if (userData?.comandaId && userData.accessToken) {
      return this.buscarComanda(userData.comandaId);
    }

    return throwError(() => new Error('Nenhuma comanda ativa encontrada'));
  }

  /**
   * Limpa todos os dados da sessão após encerrar comanda
   */
  limparSessaoComanda(): void {
    this.localStorageService.clearUserData();
    this.comandaAtualState.set(null);
    this.itensState.set([]);
  }

  // === ITENS DA COMANDA DO CLIENTE ===

  /**
   * Adicionar item à comanda; se o produto já está nela, soma a quantidade
   */
  adicionarItem(produtoId: string, quantidade: number): Observable<ItemComanda> {
    return this.garantirComandaAtiva().pipe(
      switchMap((comanda) => {
        const itemExistente = this.itensState().find((item) => item.produtoId === produtoId);
        if (itemExistente) {
          return this.atualizarQuantidadeItem(itemExistente.id, itemExistente.quantidade + quantidade);
        }

        const itemData: CreateItemComandaRequest = {
          comandaId: comanda.id,
          produtoId,
          quantidade,
        };
        return this.http.post<ItemComanda>(`${this.baseUrl}/itens-comanda`, itemData).pipe(
          tap((novoItem) => this.atualizarItens((itens) => [...itens, novoItem])),
        );
      }),
      catchError(this.handleErrorCliente),
    );
  }

  aumentarQuantidade(itemId: string): Observable<ItemComanda> {
    const item = this.itensState().find((i) => i.id === itemId);
    if (!item) {
      return throwError(() => new Error('Item não encontrado'));
    }
    return this.atualizarQuantidadeItem(itemId, item.quantidade + 1).pipe(
      catchError(this.handleErrorCliente),
    );
  }

  /**
   * Diminuir quantidade de um item; abaixo de 1 o item é removido
   */
  diminuirQuantidade(itemId: string): Observable<ItemComanda> {
    const item = this.itensState().find((i) => i.id === itemId);
    if (!item) {
      return throwError(() => new Error('Item não encontrado'));
    }

    const novaQuantidade = item.quantidade - 1;
    if (novaQuantidade <= 0) {
      return this.removerItem(itemId).pipe(map(() => item));
    }
    return this.atualizarQuantidadeItem(itemId, novaQuantidade).pipe(
      catchError(this.handleErrorCliente),
    );
  }

  removerItem(itemId: string): Observable<void> {
    return this.garantirComandaAtiva().pipe(
      switchMap(() => this.http.delete<void>(`${this.baseUrl}/itens-comanda/${itemId}`)),
      tap(() => this.atualizarItens((itens) => itens.filter((i) => i.id !== itemId))),
      catchError(this.handleErrorCliente),
    );
  }

  private atualizarQuantidadeItem(itemId: string, quantidade: number): Observable<ItemComanda> {
    return this.garantirComandaAtiva().pipe(
      switchMap(() => this.atualizarQuantidadeItemAdmin(itemId, quantidade)),
      tap((itemAtualizado) =>
        this.atualizarItens((itens) => itens.map((i) => (i.id === itemId ? itemAtualizado : i))),
      ),
    );
  }

  // === ADMIN ===

  /**
   * Lista todas as comandas, já com seus itens
   */
  obterComandasCompletas(): Observable<Comanda[]> {
    return this.http
      .get<Comanda[]>(`${this.baseUrl}/comandas`)
      .pipe(map((comandas) => comandas.map(normalizarComanda)));
  }

  /**
   * Abre uma comanda pelo painel; não gera token nem altera o estado do cliente.
   * O cliente entra nela depois pelo celular (reconectar).
   */
  criarComandaAdmin(nomeCliente: string, celular: string): Observable<Comanda> {
    const dados: CreateComandaRequest = {
      nomeCliente: nomeCliente.trim(),
      celular: celular.trim(),
    };

    return this.http
      .post<Comanda>(`${this.baseUrl}/comandas/admin`, dados)
      .pipe(map(normalizarComanda));
  }

  /**
   * Buscar comanda por ID sem alterar o estado do cliente
   */
  obterComanda(id: string): Observable<Comanda> {
    return this.http.get<Comanda>(`${this.baseUrl}/comandas/${id}`).pipe(map(normalizarComanda));
  }

  obterItensComanda(comandaId: string): Observable<ItemComanda[]> {
    return this.http.get<ItemComanda[]>(`${this.baseUrl}/comandas/${comandaId}/itens`);
  }

  encerrarComandaAdmin(comandaId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/comandas/${comandaId}/encerrar`, {});
  }

  confirmarPagamentoAdmin(comandaId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/comandas/${comandaId}/confirmarPagamento`, {});
  }

  adicionarItemAdmin(comandaId: string, produtoId: string, quantidade: number): Observable<ItemComanda> {
    const itemData: CreateItemComandaRequest = { comandaId, produtoId, quantidade };
    return this.http.post<ItemComanda>(`${this.baseUrl}/itens-comanda`, itemData);
  }

  atualizarQuantidadeItemAdmin(itemId: string, quantidade: number): Observable<ItemComanda> {
    const updateData: UpdateItemComandaRequest = { quantidade };
    return this.http.put<ItemComanda>(`${this.baseUrl}/itens-comanda/${itemId}`, updateData);
  }

  removerItemAdmin(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/itens-comanda/${itemId}`);
  }

  // === AUXILIARES ===

  private definirComandaAtual(apiComanda: Comanda): Comanda {
    const comanda = normalizarComanda(apiComanda);
    this.comandaAtualState.set(comanda);
    this.itensState.set(comanda.itens ?? []);
    return comanda;
  }

  /**
   * Atualiza os itens e recalcula o valor total da comanda atual
   */
  private atualizarItens(atualizar: (itens: ItemComanda[]) => ItemComanda[]): void {
    const itens = atualizar(this.itensState());
    this.itensState.set(itens);

    const comandaAtual = this.comandaAtualState();
    if (comandaAtual) {
      const valorTotal = itens.reduce((total, i) => total + i.valorUnitario * i.quantidade, 0);
      this.comandaAtualState.set({ ...comandaAtual, valorTotal });
    }
  }

  /**
   * Erros das ações do cliente nos itens: se a comanda foi encerrada ou paga pelo caixa
   * enquanto o cliente usava o app, redireciona para o aviso
   */
  private handleErrorCliente = (error: HttpErrorResponse) => {
    const comandaAtual = this.comandaAtualState();

    if (error.status === 400 && comandaAtual) {
      this.buscarComanda(comandaAtual.id).subscribe({
        next: (comanda) => {
          if (comanda.status !== 'ABERTA') {
            this.router.navigate(['/encerrada']);
          }
        },
        error: () => {},
      });
    }

    return throwError(() => error);
  };
}

function normalizarComanda(apiComanda: Comanda): Comanda {
  return {
    id: apiComanda.id,
    numeroComanda: apiComanda.numeroComanda,
    nomeCliente: apiComanda.nomeCliente,
    celular: apiComanda.celular,
    status: apiComanda.status,
    valorTotal: apiComanda.valorTotal || 0,
    total: apiComanda.total || apiComanda.valorTotal || 0,
    dataCriacao: apiComanda.dataCriacao,
    dataEncerramento: apiComanda.dataEncerramento,
    observacoes: apiComanda.observacoes,
    itens: apiComanda.itens || [],
  };
}
