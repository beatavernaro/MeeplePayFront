import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Comanda, ComandaStatus, Pagina, ResumoStatusComanda } from '../../../shared/models/api.interfaces';
import { ComandaService } from '../../../core/services/comanda.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import {
  NovaComandaDialogComponent,
  NovaComandaResultado,
} from './nova-comanda-dialog/nova-comanda-dialog.component';

interface Aba {
  status: ComandaStatus;
  rotulo: string;
  rotuloTotal: string;
  rotuloReceita: string;
  colunas: string[];
  vazio: { icone: string; titulo: string; texto: string };
}

const TAMANHO_PAGINA = 20;

const COLUNAS_ABERTAS =['numero', 'nome', 'status', 'dataCriacao', 'total', 'acoes'];
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
    MatPaginatorModule,
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
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Índice da aba aberta em ABAS
  readonly abaSelecionada = signal(0);
  // Índice do paginador (começa em 0; a API começa em 1)
  readonly pagina = signal(0);
  // Somente dígitos: nº da comanda ou celular
  readonly filtroBusca = signal('');
  readonly tamanhoPagina = TAMANHO_PAGINA;
  readonly carregando = signal(true);
  readonly comandasPagina = signal<Comanda[]>([]);
  readonly totalItens = signal(0);
  private readonly resumo = signal<ResumoStatusComanda[]>([]);
  // Incrementado para buscar de novo a mesma página (ex.: depois de encerrar uma comanda)
  private readonly recarga = signal(0);
  private readonly filtroDigitado$ = new Subject<string>();

  // Números das abas e dos cards vêm do resumo, que soma todas as comandas no banco
  readonly abas = computed(() =>
    ABAS.map((aba) => {
      const resumo = this.resumo().find((r) => r.status === aba.status);
      return { ...aba, quantidade: resumo?.quantidade ?? 0, receita: resumo?.receita ?? 0 };
    }),
  );

  private readonly consulta = computed(() => ({
    status: ABAS[this.abaSelecionada()].status,
    busca: this.filtroBusca(),
    pagina: this.pagina(),
    recarga: this.recarga(),
  }));

  constructor() {
    this.filtroDigitado$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((busca) => {
        this.filtroBusca.set(busca);
        this.pagina.set(0);
      });

    // switchMap descarta a resposta de uma consulta antiga quando o usuário já mudou de aba ou página
    toObservable(this.consulta)
      .pipe(
        tap(() => this.carregando.set(true)),
        switchMap(({ status, busca, pagina }) =>
          this.comandaService
            .listarComandasPaginado({ status: [status], busca, pagina: pagina + 1, tamanhoPagina: TAMANHO_PAGINA })
            .pipe(
              catchError((error) => {
                console.error('Erro ao carregar comandas:', error);
                this.notificacao.erro('Erro ao carregar comandas. Tente novamente.', { duracao: 5000 });
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => this.aplicarPagina(resultado));

    this.carregarResumo();
  }

  onFiltroBuscaChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.filtroDigitado$.next(valor.replace(/\D/g, ''));
  }

  selecionarAba(indice: number): void {
    this.comandasPagina.set([]);
    this.abaSelecionada.set(indice);
    this.pagina.set(0);
  }

  mudarPagina(event: PageEvent): void {
    this.pagina.set(event.pageIndex);
  }

  novaComanda(): void {
    this.dialog
      .open<NovaComandaDialogComponent, void, NovaComandaResultado>(NovaComandaDialogComponent, {
        width: '440px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (!resultado) return;
        if (resultado.verDetalhes) {
          this.visualizarComanda(resultado.comanda.id);
          return;
        }
        this.recarregar();
      });
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
            this.recarregar();
          },
          error: (error) => {
            console.error('Erro ao encerrar comanda:', error);
            this.notificacao.erro('Erro ao encerrar comanda');
          },
        });
      });
  }

  private recarregar(): void {
    this.recarga.update((n) => n + 1);
    this.carregarResumo();
  }

  private aplicarPagina(resultado: Pagina<Comanda> | null): void {
    if (!resultado) {
      this.comandasPagina.set([]);
      this.totalItens.set(0);
      this.carregando.set(false);
      return;
    }

    // A página ficou vazia porque a lista encolheu (ex.: encerrou a última comanda dela): vai para a última
    const ultimaPagina = Math.max(0, Math.ceil(resultado.totalItens / TAMANHO_PAGINA) - 1);
    if (resultado.itens.length === 0 && this.pagina() > ultimaPagina) {
      this.pagina.set(ultimaPagina);
      return;
    }

    this.comandasPagina.set(resultado.itens);
    this.totalItens.set(resultado.totalItens);
    this.carregando.set(false);
  }

  private carregarResumo(): void {
    this.comandaService.obterResumoComandas().subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: (error) => console.error('Erro ao carregar resumo das comandas:', error),
    });
  }
}
