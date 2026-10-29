import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Produto } from '../../../../shared/models/produto.model';

export interface ProdutoFormData {
  produto?: Produto;
  isEdit: boolean;
}

@Component({
  selector: 'app-produto-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ data.isEdit ? 'Editar Produto' : 'Novo Produto' }}</h2>

      <form [formGroup]="produtoForm" (ngSubmit)="onSubmit()" mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do Produto</mat-label>
          <input
            matInput
            formControlName="nome"
            placeholder="Digite o nome do produto"
            maxlength="50"
          />
          <mat-hint>{{ produtoForm.get('nome')?.value?.length || 0 }}/50</mat-hint>
          <mat-error *ngIf="produtoForm.get('nome')?.hasError('required')">
            O nome do produto é obrigatório
          </mat-error>
          <mat-error *ngIf="produtoForm.get('nome')?.hasError('minlength')">
            O nome deve ter pelo menos 2 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Preço</mat-label>
          <input
            matInput
            formControlName="preco"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
          />
          <span matSuffix>R$</span>
          <mat-error *ngIf="produtoForm.get('preco')?.hasError('required')">
            O preço é obrigatório
          </mat-error>
          <mat-error *ngIf="produtoForm.get('preco')?.hasError('min')">
            O preço deve ser maior que zero
          </mat-error>
        </mat-form-field>

        <div class="checkbox-container">
          <mat-checkbox formControlName="ativo"> Produto ativo </mat-checkbox>
        </div>
      </form>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="produtoForm.invalid"
          (click)="onSubmit()"
        >
          {{ data.isEdit ? 'Salvar' : 'Criar Produto' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        min-width: 400px;
        padding: 20px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .checkbox-container {
        margin-bottom: 20px;
        padding-left: 8px;
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 16px 0 0 0;
        margin: 0;
      }

      h2 {
        margin-top: 0;
        color: #556b2f;
        font-weight: 500;
      }

      mat-form-field {
        display: block;
      }

      button[mat-raised-button] {
        background-color: #556b2f !important;
        color: white !important;
      }

      mat-checkbox {
        margin: 8px 0;
      }
    `,
  ],
})
export class ProdutoFormDialogComponent {
  produtoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProdutoFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProdutoFormData,
  ) {
    this.produtoForm = this.createForm();

    // Se estiver editando, preencher os campos
    if (data.isEdit && data.produto) {
      this.produtoForm.patchValue({
        nome: data.produto.nome,
        preco: data.produto.preco,
        estoque: data.produto.estoque,
        ativo: data.produto.ativo,
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      descricao: ['', [Validators.maxLength(255)]],
      preco: [0, [Validators.required, Validators.min(0.01)]],
      categoria: ['', [Validators.maxLength(50)]],
      estoque: [0, [Validators.required, Validators.min(0)]],
      ativo: [true],
    });
  }

  onSubmit(): void {
    if (this.produtoForm.valid) {
      const formValue = this.produtoForm.value;
      const produto: Omit<Produto, 'id'> = {
        nome: formValue.nome.trim(),
        descricao: formValue.descricao?.trim() || '',
        preco: parseFloat(formValue.preco),
        categoria: formValue.categoria?.trim() || '',
        ativo: formValue.ativo,
        estoque: Number(formValue.estoque),
      };

      this.dialogRef.close(produto);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
