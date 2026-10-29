import { Injectable } from '@angular/core';

export interface UserData {
  nomeCliente: string;
  celular: string;
  comandaId?: string;
  lastActivity?: string;
  accessToken?: string;
  tokenExpiration?: string;
}

const HORA_EM_MS = 60 * 60 * 1000;

/**
 * Sessão do cliente (nome, celular, comanda e token), guardada no sessionStorage.
 * Expira após 24h sem atividade; o token também expira 24h depois de emitido.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly USER_DATA_KEY = 'comanda_virtual_user_data';

  /**
   * Salva dados do usuário, renovando a última atividade
   */
  saveUserData(userData: UserData): void {
    this.gravar({ ...userData, lastActivity: new Date().toISOString() });
  }

  /**
   * Recupera dados do usuário; dados expirados são apagados e retornam null
   */
  getUserData(): UserData | null {
    try {
      const data = sessionStorage.getItem(this.USER_DATA_KEY);
      if (!data) return null;

      const userData: UserData = JSON.parse(data);

      if (userData.lastActivity) {
        const inativoHa = Date.now() - new Date(userData.lastActivity).getTime();
        if (inativoHa > 24 * HORA_EM_MS) {
          this.clearUserData();
          return null;
        }
      }

      return userData;
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário:', error);
      return null;
    }
  }

  hasValidUserData(): boolean {
    const userData = this.getUserData();
    return userData !== null && !!userData.nomeCliente && !!userData.celular;
  }

  clearUserData(): void {
    try {
      sessionStorage.removeItem(this.USER_DATA_KEY);
    } catch (error) {
      console.error('Erro ao limpar dados do usuário:', error);
    }
  }

  updateLastActivity(): void {
    const userData = this.getUserData();
    if (userData) {
      this.saveUserData(userData);
    }
  }

  /**
   * Salva o token de acesso, válido por 24h
   */
  saveAccessToken(token: string): void {
    const userData = this.getUserData();
    this.gravar({
      ...(userData ?? ({} as UserData)),
      accessToken: token,
      tokenExpiration: new Date(Date.now() + 24 * HORA_EM_MS).toISOString(),
    });
  }

  /**
   * Token de acesso válido; se expirou, apaga a sessão e retorna null
   */
  getAccessToken(): string | null {
    const userData = this.getUserData();
    if (!userData?.accessToken || !userData.tokenExpiration) {
      return null;
    }

    if (Date.now() >= new Date(userData.tokenExpiration).getTime()) {
      this.clearUserData();
      return null;
    }

    return userData.accessToken;
  }

  private gravar(userData: UserData): void {
    try {
      sessionStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
    }
  }
}
