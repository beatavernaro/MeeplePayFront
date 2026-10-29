import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda } from '../../../../shared/models/api.interfaces';
import { ComandaService } from '../../../../core/services/comanda.service';

export interface NovaComandaResultado {
  comanda: Comanda;
  verDetalhes: boolean;
}

/**
 * Abre uma comanda pelo painel. Depois de criada, mostra o número gerado;
 * fecha com NovaComandaResultado, ou undefined se nada foi criado.
 */
@Component({
  selector: 'app-nova-comanda-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
  ],
  template: `
    @if (criada(); as comanda) {
      <h2 mat-dialog-title>Comanda criada com sucesso!</h2>
      <mat-dialog-content class="sucesso">
        <lucide-icon name="circle-check" class="sucesso__icone" />
        <span class="sucesso__rotulo">Número da comanda</span>
        <span class="sucesso__numero">#{{ comanda.numeroComanda }}</span>
        <p>
          {{ comanda.nomeCliente }} pode acessar a comanda informando o celular
          <strong>{{ comanda.celular }}</strong>.
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="fechar(comanda, false)">Fechar</button>
        <button mat-raised-button (click)="fechar(comanda, true)">Ver comanda</button>
      </mat-dialog-actions>
    } @else {
      <h2 mat-dialog-title>Nova Comanda</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <mat-form-field appearance="outline" class="campo">
            <mat-label>Nome do cliente</mat-label>
            <input matInput formControlName="nomeCliente" maxlength="100" />
            @if (form.controls.nomeCliente.hasError('required')) {
              <mat-error>Nome é obrigatório</mat-error>
            }
            @if (form.controls.nomeCliente.hasError('minlength')) {
              <mat-error>Nome deve ter pelo menos 2 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="campo">
            <mat-label>Celular</mat-label>
            <input
              matInput
              formControlName="celular"
              type="tel"
              inputmode="numeric"
              maxlength="11"
              placeholder="11999998888"
              (input)="somenteDigitos($event)"
            />
            @if (form.controls.celular.hasError('required')) {
              <mat-error>Celular é obrigatório</mat-error>
            }
            @if (form.controls.celular.hasError('pattern')) {
              <mat-error>Celular deve ter 10 ou 11 dígitos</mat-error>
            }
          </mat-form-field>

          @if (erro()) {
            <p class="erro" role="alert">{{ erro() }}</p>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close [disabled]="salvando()">Cancelar</button>
          <button mat-raised-button type="submit" [disabled]="salvando()">
            {{ salvando() ? 'Criando...' : 'Criar comanda' }}
          </button>
        </mat-dialog-actions>
      </form>
    }
  `,
  styles: [
    `
      .campo {
        width: 100%;
      }

      .erro {
        color: var(--color-danger-text);
        background: var(--color-danger-soft);
        border: 1px solid var(--color-danger-border);
        border-radius: var(--radius-control);
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
      }

      .sucesso {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        text-align: center;

        p {
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }
      }

      .sucesso__icone {
        color: var(--color-success);
        width: 40px;
        height: 40px;
      }

      .sucesso__rotulo {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }

      .sucesso__numero {
        color: var(--color-primary);
        font-size: var(--text-4xl);
        font-weight: 700;
        line-height: 1.1;
      }

      mat-dialog-actions {
        gap: var(--space-2);
        padding: var(--space-2) var(--space-6) var(--space-5);
      }
    `,
  ],
})
export class NovaComandaDialogComponent {
  private comandaService = inject(ComandaService);
  private dialogRef =
    inject<MatDialogRef<NovaComandaDialogComponent, NovaComandaResultado>>(MatDialogRef);

  readonly form = inject(FormBuilder).nonNullable.group({
    nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
    celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
  });

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly criada = signal<Comanda | null>(null);

  somenteDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '');
    if (digitos !== input.value) {
      this.form.controls.celular.setValue(digitos);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.dialogRef.disableClose = true;

    const { nomeCliente, celular } = this.form.getRawValue();
    this.comandaService.criarComandaAdmin(nomeCliente, celular).subscribe({
      next: (comanda) => {
        // Continua sem fechar por fora: o fechamento pelos botões avisa a lista para recarregar
        this.salvando.set(false);
        this.criada.set(comanda);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao criar comanda:', error);
        this.salvando.set(false);
        this.dialogRef.disableClose = false;
        this.erro.set(mensagemDeErro(error));
      },
    });
  }

  fechar(comanda: Comanda, verDetalhes: boolean): void {
    this.dialogRef.close({ comanda, verDetalhes });
  }
}

function mensagemDeErro(error: HttpErrorResponse): string {
  // Regra de negócio (ex.: celular com comanda aberta) vem em { message }
  if (error.status === 400 && typeof error.error?.message === 'string' && !error.error?.errors) {
    return error.error.message;
  }
  return 'Erro ao criar comanda. Tente novamente.';
}
