import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda, ComandaStatus } from '../../../shared/models/api.interfaces';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';

interface Aba {
  status: ComandaStatus;
  rotulo: string;
  rotuloTotal: string;
  rotuloReceita: string;
  colunas: string[];
  vazio: { icone: string; titulo: string; texto: string };
}

const COLUNAS_ABERTAS = ['numero', 'nome', 'status', 'dataCriacao', 'total', 'acoes'];
const COLUNAS_FECHADAS = ['numero', 'nome', 'status', 'dataCriacao', 'dataEncerramento', 'total', 'acoes'];

const ABAS: Aba[] = [
  {
    status: 'ABERTA',
    rotulo: 'Abertas',
    rotuloTotal: 'Total Abertas',
    rotuloReceita: 'Receita Pendente',
    colunas: COLUNAS_ABERTAS,
    vazio: {
      icone: 'receipt-text',
      titulo: 'Nenhuma comanda aberta',
      texto: 'Todas as comandas estão encerradas ou ainda não foram iniciadas.',
    },
  },
  {
    status: 'ENCERRADA',
    rotulo: 'Encerradas',
    rotuloTotal: 'Total Encerradas',
    rotuloReceita: 'Receita Total',
    colunas: COLUNAS_FECHADAS,
    vazio: {
      icone: 'circle-check',
      titulo: 'Nenhuma comanda encerrada',
      texto: 'Ainda não há comandas finalizadas no sistema.',
    },
  },
  {
    status: 'PAGA',
    rotulo: 'Comandas Pagas',
    rotuloTotal: 'Total Comandas Pagas',
    rotuloReceita: 'Receita Total',
    colunas: COLUNAS_FECHADAS,
    vazio: {
      icone: 'circle-check',
      titulo: 'Nenhuma comanda paga',
      texto: 'Ainda não há comandas pagas no sistema.',
    },
  },
];

@Component({
  selector: 'app-admin-comandas',
  imports: [
    CurrencyPipe,
    DatePipe,
    LowerCasePipe,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
  ],
  templateUrl: './comandas.component.html',
  styleUrl: './comandas.component.scss',
})
export class AdminComandasComponent {
  private comandaService = inject(ComandaService);
  private notificacao = inject(NotificacaoService);
  private router = inject(Router);

  private readonly comandas = signal<Comanda[]>([]);
  // Somente dígitos: nº da comanda ou celular
  readonly filtroBusca = signal('');

  readonly abas = computed(() => {
    const filtro = this.filtroBusca();
    return ABAS.map((aba) => {
      const comandas = this.comandas().filter((c) => c.status === aba.status);
      return {
        ...aba,
        comandas,
        receita: comandas.reduce((total, c) => total + c.valorTotal, 0),
        filtradas: filtro ? comandas.filter((c) => correspondeAoFiltro(c, filtro)) : comandas,
      };
    });
  });

  constructor() {
    this.carregarComandas();
  }

  onFiltroBuscaChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.filtroBusca.set(valor.replace(/\D/g, ''));
  }

  visualizarComanda(id: string): void {
    this.router.navigate(['/admin/comandas', id]);
  }

  encerrarComanda(comanda: Comanda): void {
    this.notificacao
      .confirmar(
        {
          title: 'Encerrar Comanda',
          message: `Tem certeza que deseja encerrar a comanda #${comanda.numeroComanda}?`,
          confirmText: 'Encerrar',
          cancelText: 'Cancelar',
        },
        '400px',
      )
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.comandaService.encerrarComandaAdmin(comanda.id).subscribe({
          next: () => {
            this.notificacao.sucesso('Comanda encerrada com sucesso!');
            this.carregarComandas();
          },
          error: (error) => {
            console.error('Erro ao encerrar comanda:', error);
            this.notificacao.erro('Erro ao encerrar comanda');
          },
        });
      });
  }

  private carregarComandas(): void {
    this.comandaService.obterComandasCompletas().subscribe({
      next: (comandas) => this.comandas.set(comandas),
      error: (error) => {
        console.error('Erro ao carregar comandas:', error);
        this.notificacao.erro('Erro ao carregar comandas. Tente novamente.', { duracao: 5000 });
        this.comandas.set([]);
      },
    });
  }
}

function correspondeAoFiltro(comanda: Comanda, filtro: string): boolean {
  return (
    String(comanda.numeroComanda).includes(filtro) ||
    (comanda.celular || '').replace(/\D/g, '').includes(filtro)
  );
}
