import { Comanda as ApiComanda, ItemComanda, ComandaStatus } from './api.interfaces';

export interface Comanda extends ApiComanda {}

export interface ComandaResumo {
  id: string;
  numeroComanda: number;
  nomeCliente: string;
  valorTotal: number;
  quantidadeItens: number;
  status: string;
  dataCriacao: string;
}

export type { ItemComanda };
