import { Produto as ApiProduto } from './api.interfaces';

export interface Produto extends ApiProduto {}

export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  estoque?: number;
}
