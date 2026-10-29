import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule } from 'lucide-angular';
import { CreateProdutoRequest } from '../../../../shared/models/api.interfaces';
import { ProdutoService } from '../../../../core/services/produto.service';
import { NotificacaoService } from '../../../../core/services/notificacao.service';

@Component({
  selector: 'app-produto-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    LucideAngularModule,
  ],
  template: `
    <div class="page page--narrow">
      <!-- Header com navegação -->
      <div class="page-header">
        <div class="page-header__title">
          <button mat-icon-button (click)="voltar()" class="back-button" aria-label="Voltar para produtos">
            <lucide-icon name="arrow-left" />
          </button>
          <h1>{{ isEditMode ? 'Editar Produto' : 'Novo Produto' }}</h1>
        </div>
      </div>

      <!-- Formulário -->
      <form [formGroup]="produtoForm" (ngSubmit)="onSubmit()" class="form-container surface-card">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do Produto</mat-label>
          <input
            matInput
            formControlName="nome"
            placeholder="Digite o nome do produto"
            maxlength="50"
            required
            #nomeInput
          />
          <mat-hint align="end">{{ nomeInput.value.length || 0 }}/50</mat-hint>
          @if (produtoForm.controls.nome.hasError('required')) {
            <mat-error>O nome do produto é obrigatório</mat-error>
          }
          @if (produtoForm.controls.nome.hasError('minlength')) {
            <mat-error>O nome deve ter pelo menos 2 caracteres</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Preço</mat-label>
            <span matTextPrefix class="prefix-spacing">R$&nbsp;</span>
            <input
              matInput
              formControlName="preco"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              required
              (input)="formatPreco($event)"
            />
            @if (produtoForm.controls.preco.hasError('required')) {
              <mat-error>O preço é obrigatório</mat-error>
            }
            @if (produtoForm.controls.preco.hasError('min')) {
              <mat-error>O preço deve ser maior que zero</mat-error>
            }
            @if (produtoForm.controls.preco.hasError('invalid')) {
              <mat-error>Formato inválido. Use vírgula para decimais (ex: 10,50)</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Estoque</mat-label>
            <input matInput formControlName="estoque" type="number" min="0" step="1" placeholder="0" required />
            @if (produtoForm.controls.estoque.hasError('required')) {
              <mat-error>O estoque é obrigatório</mat-error>
            }
            @if (
              produtoForm.controls.estoque.hasError('min') || produtoForm.controls.estoque.hasError('pattern')
            ) {
              <mat-error>O estoque deve ser um número inteiro maior ou igual a zero</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="checkbox-container">
          <mat-checkbox formControlName="ativo" color="primary"> Produto ativo </mat-checkbox>
        </div>

        <!-- Botões de ação -->
        <div class="actions">
          <button mat-button type="button" (click)="voltar()" class="cancel-button">
            Cancelar
          </button>
          <button
            mat-raised-button
            type="submit"
            [disabled]="produtoForm.invalid || isLoading()"
            class="submit-button"
          >
            @if (isLoading()) {
              <lucide-icon class="spin" name="loader-circle" />
            }
            {{ isEditMode ? 'Salvar Alterações' : 'Criar Produto' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-5);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .full-width {
        width: 100%;
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-control);
        background: var(--color-surface-sunken);
        border: 1px solid var(--color-border);
      }

      .actions {
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
        margin-top: var(--space-4);
        padding-top: var(--space-5);
        border-top: 1px solid var(--color-border);
      }

      .cancel-button {
        color: var(--color-text-secondary);
      }

      .submit-button {
        min-width: 180px;
      }

      .prefix-spacing {
        color: var(--color-text-secondary);
        font-weight: var(--weight-semibold);
      }

      @media (max-width: 768px) {
        .form-container {
          padding: var(--space-4);
        }

        .form-row {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .actions {
          flex-direction: column-reverse;
        }

        .cancel-button,
        .submit-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ProdutoFormComponent {
  private router = inject(Router);
  private produtoService = inject(ProdutoService);
  private notificacao = inject(NotificacaoService);

  readonly produtoId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isEditMode = this.produtoId !== null && this.produtoId !== 'novo';
  readonly isLoading = signal(false);

  readonly produtoForm = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    descricao: ['', [Validators.maxLength(255)]],
    preco: ['', [Validators.required, precoValidator]],
    categoria: ['', [Validators.maxLength(50)]],
    estoque: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    ativo: [true],
  });

  constructor() {
    if (this.isEditMode) {
      this.carregarProduto();
    }
  }

  /**
   * Mantém o preço no formato 999999,99 enquanto o usuário digita
   */
  formatPreco(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Remove tudo que não é dígito ou vírgula
    let valor = input.value.replace(/[^\d,]/g, '');

    // Remove vírgulas extras (deixa só uma)
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }

    // Limita a 2 casas decimais após a vírgula
    if (partes.length === 2 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2);
    }

    // Limita o valor antes da vírgula a 6 dígitos
    if (partes[0].length > 6) {
      valor = partes[0].substring(0, 6) + (partes[1] ? ',' + partes[1] : '');
    }

    input.value = valor;
    this.produtoForm.patchValue({ preco: valor });
  }

  onSubmit(): void {
    if (this.produtoForm.invalid) return;

    this.isLoading.set(true);
    const formValue = this.produtoForm.getRawValue();
    const produto: CreateProdutoRequest & { ativo: boolean } = {
      nome: formValue.nome.trim(),
      descricao: formValue.descricao.trim(),
      preco: precoParaNumero(formValue.preco),
      categoria: formValue.categoria.trim(),
      ativo: formValue.ativo,
      estoque: Number(formValue.estoque),
    };

    const requisicao =
      this.isEditMode && this.produtoId
        ? this.produtoService.atualizarProduto(this.produtoId, produto)
        : this.produtoService.criarProduto(produto);
    const operacao = this.isEditMode ? 'atualizar' : 'criar';

    requisicao.subscribe({
      next: () => {
        this.notificacao.sucesso(
          this.isEditMode ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!',
        );
        this.router.navigate(['/admin/produtos']);
      },
      error: (error) => {
        console.error(`Erro ao ${operacao} produto:`, error);
        this.notificacao.erro(`Erro ao ${operacao} produto. Tente novamente.`, { duracao: 5000 });
        this.isLoading.set(false);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/admin/produtos']);
  }

  private carregarProduto(): void {
    if (!this.produtoId) return;

    this.isLoading.set(true);
    this.produtoService.obterProdutoPorId(this.produtoId).subscribe({
      next: (produto) => {
        this.produtoForm.patchValue({
          nome: produto.nome,
          preco: produto.preco.toString().replace('.', ','),
          estoque: produto.estoque,
          ativo: produto.ativo,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.notificacao.erro('Erro ao carregar produto. Tente novamente.', { duracao: 5000 });
        this.isLoading.set(false);
      },
    });
  }
}

function precoParaNumero(preco: string): number {
  return parseFloat(preco.replace(/[^\d,]/g, '').replace(',', '.'));
}

function precoValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return { required: true };
  }

  const valorLimpo = control.value.replace(/[^\d,]/g, '');
  const valorNumerico = precoParaNumero(valorLimpo);

  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return { min: true };
  }

  if (!/^\d{1,6}(,\d{1,2})?$/.test(valorLimpo)) {
    return { invalid: true };
  }

  return null;
}
