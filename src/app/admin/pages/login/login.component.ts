import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule } from 'lucide-angular';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

const MSG_CREDENCIAIS_INVALIDAS = 'Email ou senha inválidos';

@Component({
  selector: 'app-admin-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    LucideAngularModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class AdminLoginComponent {
  private adminAuthService = inject(AdminAuthService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  readonly loginForm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.adminAuthService.login(email, password).subscribe({
      next: (result) => {
        if (result.success) {
          this.notificacao.sucesso('Login realizado com sucesso!');
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.notificacao.erro(MSG_CREDENCIAIS_INVALIDAS, { duracao: 5000 });
          this.loading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        const mensagem =
          error.status === 401 || error.status === 400
            ? MSG_CREDENCIAIS_INVALIDAS
            : 'Erro no servidor. Tente novamente.';
        this.notificacao.erro(mensagem, { duracao: 5000 });
        this.loading.set(false);
      },
    });
  }

  getErrorMessage(field: 'email' | 'password'): string {
    const control = this.loginForm.controls[field];
    if (control.hasError('required')) {
      return `${field === 'email' ? 'Email' : 'Senha'} é obrigatório`;
    }
    if (control.hasError('email')) {
      return 'Email inválido';
    }
    if (control.hasError('minlength')) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return '';
  }
}
