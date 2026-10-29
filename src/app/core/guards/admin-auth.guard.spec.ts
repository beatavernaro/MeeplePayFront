import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';

const AGORA_S = Math.floor(Date.now() / 1000);

function jwt(claims: object): string {
  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(claims)}.assinatura`;
}

describe('adminAuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function executar(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      adminAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  function url(resultado: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('token de admin válido libera o acesso', () => {
    localStorage.setItem('adminToken', jwt({ tipo: 'admin', exp: AGORA_S + 3600 }));
    expect(executar()).toBe(true);
  });

  it('sem token redireciona para o login', () => {
    expect(url(executar())).toBe('/admin/login');
  });

  it.each([
    ['expirado', jwt({ tipo: 'admin', exp: AGORA_S - 60 })],
    ['de cliente', jwt({ tipo: 'cliente', exp: AGORA_S + 3600 })],
    ['sem expiração', jwt({ tipo: 'admin' })],
    ['malformado', 'nao-e-um-jwt'],
  ])('token %s redireciona para o login e é apagado', (_, token) => {
    localStorage.setItem('adminToken', token);
    expect(url(executar())).toBe('/admin/login');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});
