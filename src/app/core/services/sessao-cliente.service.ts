import { Injectable } from '@angular/core';

/**
 * Token de acesso do cliente (JWT da comanda), mantido só em memória.
 * Nada fica salvo no navegador: ao recarregar a página o cliente informa o celular
 * de novo e a comanda aberta é recuperada pelo backend.
 */
@Injectable({
  providedIn: 'root',
})
export class SessaoClienteService {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  definirToken(token: string): void {
    this.accessToken = token;
  }

  limpar(): void {
    this.accessToken = null;
  }
}
