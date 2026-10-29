import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Produto } from '../../../../shared/models/produto.model';
import { ProdutoService } from '../../../../core/services/produto.service';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page page--narrow">
      <!-- Header com navegação -->
      <div class="page-header">
        <div class="page-header__title">
          <button mat-icon-button (click)="voltar()" class="back-button" aria-label="Voltar para produtos">
            <mat-icon>arrow_back</mat-icon>
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
          <mat-error *ngIf="produtoForm.get('nome')?.hasError('required')">
            O nome do produto é obrigatório
          </mat-error>
          <mat-error *ngIf="produtoForm.get('nome')?.hasError('minlength')">
            O nome deve ter pelo menos 2 caracteres
          </mat-error>
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
              (blur)="validatePreco()"
            />
            <mat-error *ngIf="produtoForm.get('preco')?.hasError('required')">
              O preço é obrigatório
            </mat-error>
            <mat-error *ngIf="produtoForm.get('preco')?.hasError('min')">
              O preço deve ser maior que zero
            </mat-error>
            <mat-error *ngIf="produtoForm.get('preco')?.hasError('invalid')">
              Formato inválido. Use vírgula para decimais (ex: 10,50)
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Estoque</mat-label>
            <input matInput formControlName="estoque" type="number" min="0" step="1" placeholder="0" required />
            <mat-hint>Baixado automaticamente quando a comanda é paga</mat-hint>
            <mat-error *ngIf="produtoForm.get('estoque')?.hasError('required')">
              O estoque é obrigatório
            </mat-error>
            <mat-error
              *ngIf="produtoForm.get('estoque')?.hasError('min') || produtoForm.get('estoque')?.hasError('pattern')"
            >
              O estoque deve ser um número inteiro maior ou igual a zero
            </mat-error>
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
            [disabled]="produtoForm.invalid || isLoading"
            class="submit-button"
          >
            <mat-icon *ngIf="isLoading" aria-hidden="true">hourglass_empty</mat-icon>
            {{ isEditMode ? 'Salvar Alterações' : 'Criar Produto' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .back-button {
        color: var(--color-text-secondary);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-6);
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
        border-radius: var(--radius-md);
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
export class ProdutoFormComponent implements OnInit {
  produtoForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  produtoId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
  ) {
    this.produtoForm = this.createForm();
  }

  ngOnInit(): void {
    this.produtoId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = this.produtoId !== null && this.produtoId !== 'novo';

    if (this.isEditMode && this.produtoId) {
      this.carregarProduto();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      descricao: ['', [Validators.maxLength(255)]],
      preco: ['', [Validators.required, this.precoValidator]],
      categoria: ['', [Validators.maxLength(50)]],
      estoque: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      ativo: [true],
    });
  }

  private precoValidator(control: any) {
    if (!control.value) {
      return { required: true };
    }

    const valorLimpo = control.value.replace(/[^\d,]/g, '');
    const valorNumerico = parseFloat(valorLimpo.replace(',', '.'));

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return { min: true };
    }

    if (!/^\d{1,6}(,\d{1,2})?$/.test(valorLimpo)) {
      return { invalid: true };
    }

    return null;
  }

  formatPreco(event: any): void {
    let valor = event.target.value;

    // Remove tudo que não é dígito ou vírgula
    valor = valor.replace(/[^\d,]/g, '');

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

    event.target.value = valor;
    this.produtoForm.patchValue({ preco: valor });
  }

  validatePreco(): void {
    const precoControl = this.produtoForm.get('preco');
    if (precoControl && precoControl.value) {
      precoControl.updateValueAndValidity();
    }
  }

  private carregarProduto(): void {
    if (!this.produtoId) return;

    this.isLoading = true;
    this.produtoService.obterProdutoPorId(this.produtoId).subscribe({
      next: (produto: Produto | null) => {
        if (produto) {
          this.produtoForm.patchValue({
            nome: produto.nome,
            preco: produto.preco.toString().replace('.', ','),
            estoque: produto.estoque,
            ativo: produto.ativo,
          });
        } else {
          this.snackBar.open('Produto não encontrado.', 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.snackBar.open('Erro ao carregar produto. Tente novamente.', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.produtoForm.valid) {
      this.isLoading = true;
      const formValue = this.produtoForm.value;
      const precoLimpo = formValue.preco.replace(/[^\d,]/g, '');
      const precoNumerico = parseFloat(precoLimpo.replace(',', '.'));

      const produto: Omit<Produto, 'id'> = {
        nome: formValue.nome.trim(),
        descricao: formValue.descricao?.trim() || '',
        preco: precoNumerico,
        categoria: formValue.categoria?.trim() || '',
        ativo: formValue.ativo,
        estoque: Number(formValue.estoque),
      };

      if (this.isEditMode && this.produtoId) {
        // Editar produto existente
        this.produtoService.atualizarProduto(this.produtoId, produto).subscribe({
          next: () => {
            this.snackBar.open('Produto atualizado com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            this.router.navigate(['/admin/produtos']);
          },
          error: (error) => {
            console.error('Erro ao atualizar produto:', error);
            this.snackBar.open('Erro ao atualizar produto. Tente novamente.', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
            this.isLoading = false;
          },
        });
      } else {
        // Criar novo produto
        this.produtoService.criarProduto(produto).subscribe({
          next: () => {
            this.snackBar.open('Produto criado com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            this.router.navigate(['/admin/produtos']);
          },
          error: (error) => {
            console.error('Erro ao criar produto:', error);
            this.snackBar.open('Erro ao criar produto. Tente novamente.', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
            });
            this.isLoading = false;
          },
        });
      }
    }
  }

  voltar(): void {
    this.router.navigate(['/admin/produtos']);
  }
}
