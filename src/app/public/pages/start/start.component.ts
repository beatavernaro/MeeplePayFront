import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda } from '../../../shared/models/api.interfaces';
import { ComandaService } from '../../../core/services/comanda.service';
import { LocalStorageService, UserData } from '../../../core/services/local-storage.service';
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
  private localStorageService = inject(LocalStorageService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    nomeCliente: ['', [Validators.required, Validators.minLength(2)]],
    celular: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
  });

  readonly loading = signal(false);
  readonly hasActiveSession = signal(this.localStorageService.hasValidUserData());
  readonly userData = signal<UserData | null>(
    this.hasActiveSession() ? this.localStorageService.getUserData() : null,
  );

  constructor() {
    // Pré-preencher o formulário com dados salvos
    const userData = this.userData();
    if (userData) {
      this.form.patchValue({ nomeCliente: userData.nomeCliente, celular: userData.celular });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    // Se já há dados salvos, continuar com comanda existente
    if (this.hasActiveSession() && this.userData()?.comandaId) {
      this.localStorageService.updateLastActivity();
      this.notificacao.sucesso('Continuando com sua comanda...');
      this.router.navigate(['/cardapio']);
      this.loading.set(false);
      return;
    }

    const { nomeCliente, celular } = this.form.getRawValue();
    this.checkExistingComanda(nomeCliente, celular);
  }

  onRecoverComanda(): void {
    const { celular } = this.form.controls;
    if (celular.invalid) {
      this.notificacao.erro('Por favor, informe um celular válido para recuperar a comanda', {
        duracao: 5000,
      });
      return;
    }

    this.loading.set(true);
    this.checkExistingComanda(this.form.controls.nomeCliente.value, celular.value);
  }

  onClearSession(): void {
    this.comandaService.limparSessaoComanda();
    this.hasActiveSession.set(false);
    this.userData.set(null);
    this.form.reset();
    this.notificacao.sucesso('Dados limpos. Você pode iniciar uma nova comanda.');
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

  /**
   * Primeiro tenta reconectar à comanda aberta deste celular; se não houver, cria uma nova
   */
  private checkExistingComanda(nomeCliente: string, celular: string): void {
    this.comandaService.reconectarComanda(nomeCliente, celular).subscribe({
      next: (comanda) => this.entrarNaComanda(comanda, nomeCliente, celular, 'Comanda recuperada com sucesso!'),
      error: (error) => {
        console.error('Erro ao reconectar comanda:', error);
        this.createNewComanda(nomeCliente, celular);
      },
    });
  }

  private createNewComanda(nomeCliente: string, celular: string): void {
    // Limpar tudo da sessão anterior antes de criar nova comanda
    this.comandaService.limparSessaoComanda();

    this.comandaService.criarNovaComanda(nomeCliente, celular).subscribe({
      next: (comanda) => this.entrarNaComanda(comanda, nomeCliente, celular, 'Comanda criada com sucesso!'),
      error: (error) => {
        console.error('Erro ao criar comanda:', error);
        this.loading.set(false);
        this.notificacao.erro('Erro ao criar comanda. Tente novamente.', { duracao: 5000 });
      },
    });
  }

  private entrarNaComanda(comanda: Comanda, nomeCliente: string, celular: string, mensagem: string): void {
    // Preserva os dados já salvos, incluindo o token que o service acabou de gravar
    this.localStorageService.saveUserData({
      ...this.localStorageService.getUserData(),
      nomeCliente,
      celular,
      comandaId: comanda.id,
    });
    this.notificacao.sucesso(mensagem);
    this.loading.set(false);
    this.router.navigate(['/cardapio']);
  }
}
