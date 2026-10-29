import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Produto,
  CreateProdutoRequest,
  UpdateProdutoRequest,
} from '../../shared/models/api.interfaces';

/**
 * Chamadas da API de produtos. Erros 401/403 são tratados no AuthInterceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Listar produtos ativos (cardápio do cliente)
   */
  obterProdutosAtivos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/produtos/ativos`);
  }

  /**
   * Listar todos os produtos (Admin)
   */
  obterTodosProdutos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/produtos`);
  }

  obterProdutoPorId(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.baseUrl}/produtos/${id}`);
  }

  criarProduto(produto: CreateProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(`${this.baseUrl}/produtos`, produto);
  }

  atualizarProduto(id: string, updates: UpdateProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.baseUrl}/produtos/${id}`, updates);
  }
}
