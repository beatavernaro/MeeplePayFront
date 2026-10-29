import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { adminAuthGuard } from './admin-auth.guard';
import { environment } from '../../../environments/environment';

const AGORA_S = Math.floor(Date.now() / 1000);
const URL_SESSAO = `${environment.apiUrl}/auth/sessao`;

function jwt(claims: object): string {
  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(claims)}.assinatura`;
}

describe('adminAuthGuard', () => {
  let httpTesting: HttpTestingController;
  const tokenValido = jwt({ tipo: 'admin', exp: AGORA_S + 3600 });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function executar(): Promise<boolean | UrlTree> {
    const resultado = TestBed.runInInjectionContext(() =>
      adminAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    return firstValueFrom(resultado);
  }

  function url(resultado: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('libera o acesso quando a API confirma o token', async () => {
    localStorage.setItem('adminToken', tokenValido);
    const resultado = executar();
    httpTesting.expectOne(URL_SESSAO).flush(null, { status: 204, statusText: 'No Content' });
    expect(await resultado).toBe(true);
  });

  it('não pergunta de novo para a API um token já confirmado', async () => {
    localStorage.setItem('adminToken', tokenValido);
    const primeira = executar();
    httpTesting.expectOne(URL_SESSAO).flush(null, { status: 204, statusText: 'No Content' });
    await primeira;

    expect(await executar()).toBe(true);
  });

  it.each([401, 403])('API recusa o token (%s): apaga e vai para o login', async (status) => {
    localStorage.setItem('adminToken', tokenValido);
    const resultado = executar();
    httpTesting.expectOne(URL_SESSAO).flush({}, { status, statusText: 'erro' });
    expect(url(await resultado)).toBe('/admin/login');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('API fora do ar não bloqueia o painel', async () => {
    localStorage.setItem('adminToken', tokenValido);
    const resultado = executar();
    httpTesting.expectOne(URL_SESSAO).error(new ProgressEvent('error'));
    expect(await resultado).toBe(true);
  });

  it('sem token redireciona para o login sem chamar a API', async () => {
    expect(url(await executar())).toBe('/admin/login');
  });

  it.each([
    ['expirado', jwt({ tipo: 'admin', exp: AGORA_S - 60 })],
    ['de cliente', jwt({ tipo: 'cliente', exp: AGORA_S + 3600 })],
    ['sem expiração', jwt({ tipo: 'admin' })],
    ['malformado', 'nao-e-um-jwt'],
  ])('token %s redireciona para o login e é apagado, sem chamar a API', async (_, token) => {
    localStorage.setItem('adminToken', token);
    expect(url(await executar())).toBe('/admin/login');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});
