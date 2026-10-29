import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { SessaoClienteService } from '../services/sessao-cliente.service';

const API = 'https://api.test/api';
const ADMIN_TOKEN = 'admin-token';
const USER_TOKEN = 'user-token';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };

  let sessao: SessaoClienteService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('adminToken', ADMIN_TOKEN);

    router = { url: '/cardapio', navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([AuthInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoClienteService);
    sessao.iniciar(USER_TOKEN, 'c1');
  });

  afterEach(() => httpTesting.verify());

  function authHeaderFor(method: string, url: string): string | null {
    http.request(method, url, { body: {} }).subscribe({ error: () => {} });
    const req = httpTesting.expectOne(url);
    const header = req.request.headers.get('Authorization');
    req.flush({});
    return header;
  }

  describe('token anexado fora das rotas de admin', () => {
    const casos: [string, string, string | null][] = [
      ['POST', `${API}/auth/login`, ADMIN_TOKEN],
      ['GET', `${API}/admin/qualquer`, ADMIN_TOKEN],
      ['GET', `${API}/produtos/ativos`, USER_TOKEN],
      ['POST', `${API}/produtos`, USER_TOKEN],
      ['POST', `${API}/itens-comanda`, USER_TOKEN],
      ['PUT', `${API}/itens-comanda/i1`, USER_TOKEN],
      ['DELETE', `${API}/itens-comanda/i1`, USER_TOKEN],
      ['PUT', `${API}/comandas/c1/encerrar`, USER_TOKEN],
      ['POST', `${API}/comandas`, USER_TOKEN],
      ['GET', `${API}/comandas`, USER_TOKEN],
      ['GET', `${API}/comandas/c1`, null],
      ['GET', `${API}/comandas/c1/itens`, null],
      ['GET', `${API}/comandas/celular/11999998888`, null],
      ['POST', `${API}/comandas/reconectar`, null],
      ['PUT', `${API}/comandas/c1/confirmarPagamento`, null],
    ];

    it.each(casos)('%s %s -> %s', (method, url, esperado) => {
      const header = authHeaderFor(method, url);
      expect(header).toBe(esperado ? `Bearer ${esperado}` : null);
    });
  });

  it('usa o token admin em qualquer endpoint quando está em rota de admin', () => {
    router.url = '/admin/comandas';
    expect(authHeaderFor('GET', `${API}/comandas/c1`)).toBe(`Bearer ${ADMIN_TOKEN}`);
    expect(authHeaderFor('PUT', `${API}/comandas/c1/confirmarPagamento`)).toBe(
      `Bearer ${ADMIN_TOKEN}`,
    );
    expect(authHeaderFor('GET', `${API}/produtos`)).toBe(`Bearer ${ADMIN_TOKEN}`);
  });

  it('não anexa token quando não há token salvo', () => {
    localStorage.clear();
    sessao.limpar();
    expect(authHeaderFor('GET', `${API}/produtos/ativos`)).toBeNull();
    expect(authHeaderFor('POST', `${API}/auth/login`)).toBeNull();
  });

  describe('tratamento de erros', () => {
    function falhar(url: string, status: number): void {
      http.get(url).subscribe({ error: () => {} });
      httpTesting.expectOne(url).flush({}, { status, statusText: 'erro' });
    }

    it('401 em rota de admin faz logout e vai para o login do admin', () => {
      router.url = '/admin/produtos';
      falhar(`${API}/produtos`, 401);
      expect(localStorage.getItem('adminToken')).toBeNull();
      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
    });

    it('403 em rota de admin faz logout e vai para o login do admin', () => {
      router.url = '/admin/comandas';
      falhar(`${API}/comandas`, 403);
      expect(localStorage.getItem('adminToken')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
      expect(sessao.getAccessToken()).toBe(USER_TOKEN);
    });

    it('401 fora do admin limpa a sessão do cliente e vai para /start', () => {
      falhar(`${API}/produtos/ativos`, 401);
      expect(sessao.getAccessToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/start']);
    });

    it('403 limpa a sessão do cliente e vai para /start', () => {
      falhar(`${API}/itens-comanda`, 403);
      expect(sessao.getAccessToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/start']);
    });

    it('outros erros não redirecionam', () => {
      falhar(`${API}/produtos/ativos`, 500);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
