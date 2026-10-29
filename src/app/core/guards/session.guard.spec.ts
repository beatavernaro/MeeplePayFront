import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { sessionGuard } from './session.guard';
import { ComandaService } from '../services/comanda.service';
import { LocalStorageService } from '../services/local-storage.service';

describe('sessionGuard', () => {
  let buscarComanda: ReturnType<typeof vi.fn>;
  let storage: LocalStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    buscarComanda = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ComandaService, useValue: { buscarComanda } }],
    });
    storage = TestBed.inject(LocalStorageService);
  });

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
  });

  it('sessão sem comanda libera o acesso', async () => {
    storage.saveUserData({ nomeCliente: 'Ana', celular: '11999998888' });
    expect(await executar()).toBe(true);
    expect(buscarComanda).not.toHaveBeenCalled();
  });

  it('comanda aberta libera o acesso', async () => {
    storage.saveUserData({ nomeCliente: 'Ana', celular: '11999998888', comandaId: 'c1' });
    buscarComanda.mockReturnValue(of({ status: 'ABERTA' }));
    expect(await executar()).toBe(true);
    expect(buscarComanda).toHaveBeenCalledWith('c1');
  });

  it.each(['ENCERRADA', 'PAGA'])('comanda %s redireciona para /encerrada', async (status) => {
    storage.saveUserData({ nomeCliente: 'Ana', celular: '11999998888', comandaId: 'c1' });
    buscarComanda.mockReturnValue(of({ status }));
    expect(url(await executar())).toBe('/encerrada');
  });

  it('erro ao consultar a comanda libera o acesso (a tela trata)', async () => {
    storage.saveUserData({ nomeCliente: 'Ana', celular: '11999998888', comandaId: 'c1' });
    buscarComanda.mockReturnValue(throwError(() => new Error('falha')));
    expect(await executar()).toBe(true);
  });
});
