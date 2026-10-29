import { Injectable } from '@angular/core';

const CHAVE = 'meeplepay_sessao_cliente';
const DURACAO_MS = 6 * 60 * 60 * 1000;

interface SessaoSalva {
  accessToken: string;
  comandaId: string;
  expiraEm: number;
}

/**
 * Token de acesso do cliente (JWT da comanda) e o id da comanda, salvos no localStorage
 * por 6 horas só para recuperar a comanda ao recarregar a página. Os dados da comanda
 * sempre vêm do backend; a tela inicial sempre consulta pelo celular digitado.
 */
@Injectable({
  providedIn: 'root',
})
export class SessaoClienteService {
  getAccessToken(): string | null {
    return this.ler()?.accessToken ?? null;
  }

  getComandaId(): string | null {
    return this.ler()?.comandaId ?? null;
  }

  iniciar(accessToken: string, comandaId: string): void {
    const sessao: SessaoSalva = { accessToken, comandaId, expiraEm: Date.now() + DURACAO_MS };
    try {
      localStorage.setItem(CHAVE, JSON.stringify(sessao));
    } catch (error) {
      console.error('Erro ao salvar a sessão do cliente:', error);
    }
  }

  limpar(): void {
    try {
      localStorage.removeItem(CHAVE);
    } catch (error) {
      console.error('Erro ao limpar a sessão do cliente:', error);
    }
  }

  // Sessão expirada ou ilegível é apagada
  private ler(): SessaoSalva | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;

      const sessao = JSON.parse(bruto) as Partial<SessaoSalva>;
      if (
        typeof sessao.accessToken !== 'string' ||
        typeof sessao.comandaId !== 'string' ||
        typeof sessao.expiraEm !== 'number' ||
        sessao.expiraEm <= Date.now()
      ) {
        this.limpar();
        return null;
      }
      return sessao as SessaoSalva;
    } catch {
      this.limpar();
      return null;
    }
  }
}
