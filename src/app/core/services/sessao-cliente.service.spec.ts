import { TestBed } from '@angular/core/testing';
import { SessaoClienteService } from './sessao-cliente.service';

const CHAVE = 'meeplepay_sessao_cliente';
const HORA = 60 * 60 * 1000;

describe('SessaoClienteService', () => {
  let service: SessaoClienteService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(SessaoClienteService);
  });

  afterEach(() => vi.useRealTimers());

  it('começa sem sessão', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.getComandaId()).toBeNull();
  });

  it('salva token e comanda para sobreviver a um recarregamento', () => {
    service.iniciar('tok', 'c1');

    const outraInstancia = new SessaoClienteService();
    expect(outraInstancia.getAccessToken()).toBe('tok');
    expect(outraInstancia.getComandaId()).toBe('c1');
  });

  it('expira depois de 6 horas e apaga os dados', () => {
    vi.useFakeTimers();
    service.iniciar('tok', 'c1');

    vi.advanceTimersByTime(6 * HORA - 1000);
    expect(service.getComandaId()).toBe('c1');

    vi.advanceTimersByTime(2000);
    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('dados ilegíveis são descartados', () => {
    localStorage.setItem(CHAVE, '{quebrado');
    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('limpar remove a sessão', () => {
    service.iniciar('tok', 'c1');
    service.limpar();
    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });
});
