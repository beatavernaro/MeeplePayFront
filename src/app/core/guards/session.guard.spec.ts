import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { sessionGuard } from './session.guard';
import { ComandaService } from '../services/comanda.service';
import { SessaoClienteService } from '../services/sessao-cliente.service';
import { Comanda } from '../../shared/models/api.interfaces';

describe('sessionGuard', () => {
  let buscarComanda: ReturnType<typeof vi.fn>;
  let comandaAtual: ReturnType<typeof signal<Comanda | null>>;
  let sessao: SessaoClienteService;

  beforeEach(() => {
    localStorage.clear();
    buscarComanda = vi.fn();
    comandaAtual = signal<Comanda | null>(null);
    TestBed.configureTestingModule({
      providers: [{ provide: ComandaService, useValue: { buscarComanda, comandaAtual } }],
    });
    sessao = TestBed.inject(SessaoClienteService);
  });

  function entrarNaComanda(): void {
    comandaAtual.set({ id: 'c1', status: 'ABERTA' } as Comanda);
    sessao.iniciar('tok', 'c1');
  }

  async function executar(): Promise<boolean | UrlTree> {
    const resultado = TestBed.runInInjectionContext(() =>
      sessionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree | Observable<boolean | UrlTree>;
    return resultado instanceof Observable ? firstValueFrom(resultado) : resultado;
  }

  function url(resultado: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('sem sessão redireciona para /start', async () => {
    expect(url(await executar())).toBe('/start');
    expect(buscarComanda).not.toHaveBeenCalled();
  });

  it('sessão sem token (ex.: após 401) redireciona para /start', async () => {
    entrarNaComanda();
    sessao.limpar();
    expect(url(await executar())).toBe('/start');
  });

  it('comanda aberta libera o acesso', async () => {
    entrarNaComanda();
    buscarComanda.mockReturnValue(of({ status: 'ABERTA' }));
    expect(await executar()).toBe(true);
    expect(buscarComanda).toHaveBeenCalledWith('c1');
  });

  it('após recarregar a página, recupera a comanda da sessão salva', async () => {
    sessao.iniciar('tok', 'c9');
    buscarComanda.mockReturnValue(of({ status: 'ABERTA' }));
    expect(await executar()).toBe(true);
    expect(buscarComanda).toHaveBeenCalledWith('c9');
  });

  it.each(['ENCERRADA', 'PAGA'])('comanda %s redireciona para /encerrada', async (status) => {
    entrarNaComanda();
    buscarComanda.mockReturnValue(of({ status }));
    expect(url(await executar())).toBe('/encerrada');
  });

  it('erro ao consultar com comanda carregada libera o acesso (a tela trata)', async () => {
    entrarNaComanda();
    buscarComanda.mockReturnValue(throwError(() => new Error('falha')));
    expect(await executar()).toBe(true);
  });

  it('erro ao recuperar a comanda salva redireciona para /start', async () => {
    sessao.iniciar('tok', 'c9');
    buscarComanda.mockReturnValue(throwError(() => new Error('falha')));
    expect(url(await executar())).toBe('/start');
  });
});
