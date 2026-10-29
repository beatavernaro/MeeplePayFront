// Interfaces baseadas na documentação da API Comanda Virtual

export type ComandaStatus = 'ABERTA' | 'ENCERRADA' | 'PAGA';

export interface Comanda {
  id: string;
  numeroComanda: number;
  nomeCliente: string;
  celular: string;
  status: string;
  valorTotal: number;
  total: number;
  dataCriacao: string;
  dataEncerramento: string | null;
  observacoes?: string;
  itens?: ItemComanda[];
}

export interface CreateComandaRequest {
  nomeCliente: string;
  celular: string;
  observacoes?: string;
}

export interface CreateComandaResponse {
  comanda: Comanda;
  accessToken: string;
  message: string;
}

export interface ItemComanda {
  id: string;
  comandaId: string;
  produtoId: string | null;
  nome: string;
  valorUnitario: number;
  quantidade: number;
  origem: string;
}

export interface CreateItemComandaRequest {
  comandaId: string;
  produtoId?: string;
  quantidade: number;
}

export interface UpdateItemComandaRequest {
  quantidade: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ativo: boolean;
}

export interface CreateProdutoRequest {
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
}

export interface UpdateProdutoRequest {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
  ativo?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nome: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
}