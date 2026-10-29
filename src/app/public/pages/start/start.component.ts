import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule } from 'lucide-angular';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

type Campo = 'nomeCliente' | 'celular';

const LABELS: Record<Campo, string> = {
  nomeCliente: 'Nome',
  celular: 'Celular',
};

@Component({
  selector: 'app-start',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    LucideAngularModule,
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent {
  private comandaService = inject(ComandaService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
    celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
  });

  readonly loading = signal(false);

  /**
   * Sempre consulta o backend: recupera a comanda aberta deste celular ou cria uma nova
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { nomeCliente, celular } = this.form.getRawValue();
    this.comandaService.acessarComanda(nomeCliente, celular).subscribe({
      next: ({ comanda, criada }) => {
        this.loading.set(false);
        this.notificacao.sucesso(
          criada
            ? `Comanda #${comanda.numeroComanda} criada com sucesso!`
            : `Comanda #${comanda.numeroComanda} recuperada com sucesso!`,
        );
        this.router.navigate(['/cardapio']);
      },
      error: (error) => {
        console.error('Erro ao acessar comanda:', error);
        this.loading.set(false);
        this.notificacao.erro('Erro ao acessar a comanda. Tente novamente.', { duracao: 5000 });
      },
    });
  }

  getErrorMessage(field: Campo): string {
    const control = this.form.controls[field];
    if (control.hasError('required')) {
      return `${LABELS[field]} é obrigatório`;
    }
    if (control.hasError('minlength')) {
      return `${LABELS[field]} deve ter pelo menos 2 caracteres`;
    }
    if (control.hasError('pattern')) {
      return 'Celular deve conter apenas números (10 ou 11 dígitos)';
    }
    return '';
  }
}
