import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  async function renderizar(data: ConfirmDialogData): Promise<string[]> {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const botoes = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    return Array.from(botoes, (b) => b.textContent!.trim());
  }

  it('mostra cancelar e confirmar', async () => {
    const botoes = await renderizar({
      title: 'Remover Item',
      message: 'Deseja remover?',
      confirmText: 'Remover',
    });
    expect(botoes).toEqual(['Cancelar', 'Remover']);
  });

  it('no modo informativo mostra só o botão de confirmação', async () => {
    const botoes = await renderizar({
      title: 'Encerrar Comanda',
      message: 'Para finalizar sua comanda dirija-se ao caixa.',
      confirmText: 'Entendi',
      informativo: true,
    });
    expect(botoes).toEqual(['Entendi']);
  });
});
