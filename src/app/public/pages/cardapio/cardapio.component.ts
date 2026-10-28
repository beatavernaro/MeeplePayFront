import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Produto } from '../../../shared/models/produto.model';
import { ItemComanda } from '../../../shared/models/item-comanda.model';
import { Comanda } from '../../../shared/models/comanda.model';
import { ProdutoService } from '../../../core/services/produto.service';
import { ComandaService } from '../../../core/services/comanda.service';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterNavComponent } from '../../../shared/components/footer-nav/footer-nav.component';
import { CreateProdutoRequest } from '../../../shared/models/api.interfaces';

@Component({
  selector: 'app-add-item-manual',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="bottom-sheet-content">
      <h3>Adicionar Item Manual</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do produto</mat-label>
          <input matInput formControlName="nome" placeholder="Ex: Água sem gás" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Valor (R$)</mat-label>
          <input matInput formControlName="preco" type="number" step="0.01" placeholder="0.00" />
        </mat-form-field>

        <div class="actions">
          <button type="button" mat-button (click)="onCancel()">Cancelar</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="form.invalid">
            Adicionar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .bottom-sheet-content {
        padding: 24px;
        background: white !important;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        min-height: 200px;
        position: relative;
        z-index: 1000;
      }
      .bottom-sheet-content h3 {
        margin: 0 0 20px 0;
        color: #333 !important;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
      mat-form-field {
        width: 100%;
      }
      .mat-mdc-form-field {
        width: 100%;
      }
      input {
        background: white !important;
        color: #333 !important;
      }
    `,
  ],
})
export class AddItemManualComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bottomSheet: MatBottomSheet,
    private comandaService: ComandaService,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      preco: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { nome, preco } = this.form.value;
      
      // Primeiro: criar o produto
      const produtoData: CreateProdutoRequest = {
        nome,
        preco: Number(preco),
        categoria: 'MANUAL' // Categoria específica para produtos manuais
      };
      
      this.produtoService.criarProduto(produtoData).subscribe({
        next: (produtoCriado) => {
          // Segundo: adicionar o produto criado na comanda
          this.comandaService.adicionarItem(
            produtoCriado.id, // usar o ID do produto recém-criado
            1 // quantidade
          ).subscribe({
            next: () => {
              this.snackBar.open('Item adicionado!', 'Fechar', { 
                duration: 2000,
                panelClass: ['success-snackbar']
              });
              this.bottomSheet.dismiss();
            },
            error: () => {
              this.snackBar.open('Erro ao adicionar item na comanda', 'Fechar', { 
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
        },
        error: () => {
          this.snackBar.open('Erro ao criar produto', 'Fechar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onCancel(): void {
    this.bottomSheet.dismiss();
  }
}

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDividerModule,
    HeaderComponent,
    FooterNavComponent,
  ],
  templateUrl: './cardapio.component.html',
  styleUrl: './cardapio.component.scss',
})
export class CardapioComponent implements OnInit {
  produtos$!: Observable<Produto[]>;
  produtosFiltrados$!: Observable<Produto[]>;
  categorias$!: Observable<string[]>;
  itensComanda$!: Observable<ItemComanda[]>;
  comandaAtual$!: Observable<Comanda | null>;
  totalItens = 0;
  searchControl = new FormControl('');
  categoriaSelecionada = new FormControl<string>('TODOS');
  nomeUsuario = '';
  
  // Feature flag para produto manual (desabilitado por enquanto)
  readonly produtoManualHabilitado = false;

  constructor(
    private produtoService: ProdutoService,
    private comandaService: ComandaService,
    private localStorageService: LocalStorageService,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Obter nome do usuário da sessão
    const userData = this.localStorageService.getUserData();
    this.nomeUsuario = userData?.nomeCliente || 'Cliente';
    this.comandaAtual$ = this.comandaService.comandaAtual$;

    // Garantir que a comanda esteja carregada
    this.comandaService.garantirComandaAtiva().subscribe({
      next: (comanda) => {
        // Comanda ativa confirmada
      },
      error: (error) => {
        console.error('Erro ao carregar comanda ativa:', error);
        // Redirecionar para início se não conseguir carregar comanda
        this.router.navigate(['/start']);
      }
    });

    this.produtos$ = this.produtoService
      .obterProdutosAtivos()
      .pipe(map((produtos) => produtos.sort((a, b) => a.nome.localeCompare(b.nome))));

    // Extrair categorias únicas dos produtos
    this.categorias$ = this.produtos$.pipe(
      map((produtos) => {
        const categorias = Array.from(
          new Set(produtos.map((p) => p.categoria).filter((c) => c))
        ).sort();
        return ['TODOS', ...categorias];
      }),
    );

    // Combina produtos com filtro de busca e categoria
    this.produtosFiltrados$ = combineLatest([
      this.produtos$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoriaSelecionada.valueChanges.pipe(startWith('TODOS')),
    ]).pipe(
      map(([produtos, busca, categoria]) => {
        let filtrados = produtos;

        // Filtrar por categoria
        if (categoria && categoria !== 'TODOS') {
          filtrados = filtrados.filter((p) => p.categoria === categoria);
        }

        // Filtrar por busca
        if (busca?.trim()) {
          const buscaNormalizada = this.removerAcentos(busca.toLowerCase());
          filtrados = filtrados.filter((produto) =>
            this.removerAcentos(produto.nome.toLowerCase()).includes(buscaNormalizada),
          );
        }

        return filtrados;
      }),
    );

    this.itensComanda$ = this.comandaService.itensComanda$;

    this.itensComanda$.subscribe((itens) => {
      this.totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
    });
  }

  adicionarProduto(produto: Produto): void {
    this.comandaService
      .adicionarItem(
        produto.id, // produtoId como string - sem conversão
        1 // quantidade
      )
      .subscribe({
        next: (item) => {
          this.snackBar
            .open(`✓ ${produto.nome} adicionado à comanda!`, 'Ver Comanda', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            })
            .onAction()
            .subscribe(() => {
              this.irParaCarrinho();
            });
        },
        error: (error) => {
          console.error('Erro ao adicionar produto:', error);
          this.snackBar.open('❌ Erro ao adicionar produto', 'Tentar Novamente', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  abrirItemManual(): void {
    // Feature flag verificada - funcionalidade desabilitada por enquanto
    if (!this.produtoManualHabilitado) {
      this.snackBar.open('Funcionalidade em desenvolvimento', 'OK', { 
        duration: 2000,
        panelClass: ['success-snackbar']
      });
      return;
    }
    
    this.bottomSheet.open(AddItemManualComponent, {
      hasBackdrop: true,
      disableClose: false,
      panelClass: 'custom-bottom-sheet'
    });
  }

  onNavClick(route: string): void {
    this.router.navigate([`/${route}`]);
  }

  onSearchChange(searchTerm: string): void {
    this.searchControl.setValue(searchTerm);
  }

  selecionarCategoria(categoria: string): void {
    this.categoriaSelecionada.setValue(categoria);
  }

  irParaCarrinho(): void {
    this.router.navigate(['/carrinho']);
  }

  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  private removerAcentos(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
