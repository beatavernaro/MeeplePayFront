import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComandaService } from './comanda.service';
import { SessaoClienteService } from './sessao-cliente.service';
import { Comanda, ItemComanda } from '../../shared/models/api.interfaces';

const API = environment.apiUrl;

function item(parcial: Partial<ItemComanda>): ItemComanda {
  return {
    id: 'i1',
    comandaId: 'c1',
    produtoId: 'p1',
    nome: 'Café',
    valorUnitario: 5,
    quantidade: 1,
    origem: 'CATALOGO',
    ...parcial,
  };
}

function comanda(parcial: Partial<Comanda> = {}): Comanda {
  return {
    id: 'c1',
    numeroComanda: 10,
    nomeCliente: 'Ana',
    celular: '11999998888',
    status: 'ABERTA',
    valorTotal: 10,
    total: 10,
    dataCriacao: '2026-10-28T10:00:00Z',
    dataEncerramento: null,
    itens: [item({ quantidade: 2 })],
    ...parcial,
  };
}

describe('ComandaService', () => {
  let service: ComandaService;
  let httpTesting: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, url: '/cardapio' } },
      ],
    });
    service = TestBed.inject(ComandaService);
    httpTesting = TestBed.inject(HttpTestingController);

    // Carrega a comanda c1 (com 2x Café) no estado do cliente
    const carregada = firstValueFrom(service.buscarComanda('c1'));
    httpTesting.expectOne(`${API}/comandas/c1`).flush(comanda());
    await carregada;
  });

  afterEach(() => httpTesting.verify());

  it('produto já na comanda soma a quantidade no item existente', async () => {
    const resultado = firstValueFrom(service.adicionarItem('p1', 1));
    const req = httpTesting.expectOne(`${API}/itens-comanda/i1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantidade: 3 });
    req.flush(item({ quantidade: 3 }));
    await resultado;

    expect(service.itens()).toEqual([item({ quantidade: 3 })]);
    expect(service.comandaAtual()?.valorTotal).toBe(15);
    expect(service.totalItens()).toBe(3);
  });

  it('produto novo cria um item na comanda', async () => {
    const resultado = firstValueFrom(service.adicionarItem('p2', 1));
    const req = httpTesting.expectOne(`${API}/itens-comanda`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ comandaId: 'c1', produtoId: 'p2', quantidade: 1 });
    req.flush(item({ id: 'i2', produtoId: 'p2', nome: 'Suco', valorUnitario: 8 }));
    await resultado;

    expect(service.itens().map((i) => i.id)).toEqual(['i1', 'i2']);
    expect(service.comandaAtual()?.valorTotal).toBe(18);
  });

  it('diminuir abaixo de 1 remove o item', async () => {
    const reduzir = firstValueFrom(service.diminuirQuantidade('i1'));
    httpTesting.expectOne(`${API}/itens-comanda/i1`).flush(item({ quantidade: 1 }));
    await reduzir;

    const remover = firstValueFrom(service.diminuirQuantidade('i1'));
    const req = httpTesting.expectOne(`${API}/itens-comanda/i1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await remover;

    expect(service.itens()).toEqual([]);
    expect(service.comandaAtual()?.valorTotal).toBe(0);
  });

  it('400 numa ação do cliente com comanda já fechada leva para /encerrada', async () => {
    const resultado = firstValueFrom(service.adicionarItem('p2', 1)).catch(() => 'erro');
    httpTesting
      .expectOne(`${API}/itens-comanda`)
      .flush({}, { status: 400, statusText: 'Bad Request' });
    httpTesting.expectOne(`${API}/comandas/c1`).flush(comanda({ status: 'ENCERRADA' }));

    expect(await resultado).toBe('erro');
    expect(navigate).toHaveBeenCalledWith(['/encerrada']);
  });

  it('encerrarComanda encerra a comanda atual e recarrega status e total', async () => {
    const resultado = firstValueFrom(service.encerrarComanda());
    const req = httpTesting.expectOne(`${API}/comandas/c1/encerrar`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
    httpTesting.expectOne(`${API}/comandas/c1`).flush(comanda({ status: 'ENCERRADA', valorTotal: 10 }));

    expect((await resultado).status).toBe('ENCERRADA');
    expect(service.comandaAtual()?.status).toBe('ENCERRADA');
  });

  it('limparSessaoComanda zera o estado e o token', () => {
    const sessao = TestBed.inject(SessaoClienteService);
    sessao.definirToken('tok');
    service.limparSessaoComanda();
    expect(service.comandaAtual()).toBeNull();
    expect(service.itens()).toEqual([]);
    expect(sessao.getAccessToken()).toBeNull();
  });

  describe('acessarComanda', () => {
    it('recupera a comanda aberta do celular, com o nome salvo nela', async () => {
      const acesso = firstValueFrom(service.acessarComanda(' Outro Nome ', '11911112222'));
      const req = httpTesting.expectOne(`${API}/comandas/reconectar`);
      expect(req.request.body).toEqual({ celular: '11911112222' });
      req.flush({ accessToken: 'tok-104', comanda: comanda({ id: 'c104', numeroComanda: 104 }) });

      const { comanda: recuperada, criada } = await acesso;
      expect(criada).toBe(false);
      expect(recuperada.numeroComanda).toBe(104);
      expect(service.comandaAtual()?.id).toBe('c104');
      expect(service.comandaAtual()?.nomeCliente).toBe('Ana');
      expect(TestBed.inject(SessaoClienteService).getAccessToken()).toBe('tok-104');
    });

    it('sem comanda aberta (404) cria uma nova', async () => {
      const acesso = firstValueFrom(service.acessarComanda('Bia', '11933334444'));
      httpTesting
        .expectOne(`${API}/comandas/reconectar`)
        .flush({}, { status: 404, statusText: 'Not Found' });
      const req = httpTesting.expectOne(`${API}/comandas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ nomeCliente: 'Bia', celular: '11933334444' });
      req.flush({
        accessToken: 'tok-nova',
        message: '',
        comanda: comanda({ id: 'c200', numeroComanda: 200, nomeCliente: 'Bia', itens: [] }),
      });

      const { criada } = await acesso;
      expect(criada).toBe(true);
      expect(service.comandaAtual()?.id).toBe('c200');
      expect(service.itens()).toEqual([]);
      expect(TestBed.inject(SessaoClienteService).getAccessToken()).toBe('tok-nova');
    });

    it('outros erros não criam comanda', async () => {
      const acesso = firstValueFrom(service.acessarComanda('Bia', '11933334444')).catch(
        (e) => e.status,
      );
      httpTesting
        .expectOne(`${API}/comandas/reconectar`)
        .flush({}, { status: 500, statusText: 'Erro' });

      expect(await acesso).toBe(500);
      httpTesting.expectNone(`${API}/comandas`);
      expect(service.comandaAtual()).toBeNull();
    });
  });
});
