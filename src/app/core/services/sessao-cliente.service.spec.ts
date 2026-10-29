import { TestBed } from '@angular/core/testing';
import { SessaoClienteService } from './sessao-cliente.service';

describe('SessaoClienteService', () => {
  let service: SessaoClienteService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    service = TestBed.inject(SessaoClienteService);
  });

  it('começa sem token', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('guarda o token só em memória', () => {
    service.definirToken('tok');
    expect(service.getAccessToken()).toBe('tok');
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('limpar remove o token', () => {
    service.definirToken('tok');
    service.limpar();
    expect(service.getAccessToken()).toBeNull();
  });
});
