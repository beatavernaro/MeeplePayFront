import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

const KEY = 'comanda_virtual_user_data';
const HORA = 60 * 60 * 1000;

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    service = TestBed.inject(LocalStorageService);
  });

  function salvarBruto(dados: object): void {
    sessionStorage.setItem(KEY, JSON.stringify(dados));
  }

  it('salva e recupera os dados do cliente', () => {
    service.saveUserData({ nomeCliente: 'Ana', celular: '11999998888', comandaId: 'c1' });
    expect(service.getUserData()).toMatchObject({
      nomeCliente: 'Ana',
      celular: '11999998888',
      comandaId: 'c1',
    });
    expect(service.hasValidUserData()).toBe(true);
  });

  it('descarta dados com mais de 24h sem atividade', () => {
    salvarBruto({
      nomeCliente: 'Ana',
      celular: '11999998888',
      lastActivity: new Date(Date.now() - 25 * HORA).toISOString(),
    });
    expect(service.getUserData()).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('retorna o token enquanto não expirou', () => {
    service.saveUserData({ nomeCliente: 'Ana', celular: '11999998888' });
    service.saveAccessToken('tok');
    expect(service.getAccessToken()).toBe('tok');
  });

  it('limpa a sessão quando o token expirou', () => {
    salvarBruto({
      nomeCliente: 'Ana',
      celular: '11999998888',
      accessToken: 'tok',
      tokenExpiration: new Date(Date.now() - 1000).toISOString(),
      lastActivity: new Date().toISOString(),
    });
    expect(service.getAccessToken()).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('sem nome ou celular não há sessão válida', () => {
    service.saveAccessToken('tok');
    expect(service.hasValidUserData()).toBe(false);
  });
});
