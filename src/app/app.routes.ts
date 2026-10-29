import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { sessionGuard } from './core/guards/session.guard';

export const routes: Routes = [
  // Rota principal - Landing Page
  {
    path: '',
    loadComponent: () =>
      import('./public/pages/landing/landing.component').then((m) => m.LandingComponent),
  },

  // Rotas públicas (cliente)
  {
    path: 'start',
    loadComponent: () =>
      import('./public/pages/start/start.component').then((m) => m.StartComponent),
  },
  {
    path: 'cardapio',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./public/pages/cardapio/cardapio.component').then((m) => m.CardapioComponent),
  },
  {
    path: 'carrinho',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./public/pages/carrinho/carrinho.component').then((m) => m.CarrinhoComponent),
  },
  {
    path: 'encerrada',
    loadComponent: () =>
      import('./public/pages/encerrada/encerrada.component').then((m) => m.EncerradaComponent),
  },

  // Rotas administrativas
  {
    path: 'admin',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./admin/pages/login/login.component').then((m) => m.AdminLoginComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
        canActivate: [adminAuthGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./admin/pages/dashboard/dashboard.component').then(
                (m) => m.AdminDashboardComponent,
              ),
          },
          {
            path: 'comandas',
            loadComponent: () =>
              import('./admin/pages/comandas/comandas.component').then(
                (m) => m.AdminComandasComponent,
              ),
          },
          {
            path: 'comandas/:id',
            loadComponent: () =>
              import('./admin/pages/comandas/comanda-detalhes/comanda-detalhes.component').then(
                (m) => m.ComandaDetalhesComponent,
              ),
          },
          {
            path: 'produtos',
            loadComponent: () =>
              import('./admin/pages/produtos/produtos.component').then(
                (m) => m.AdminProdutosComponent,
              ),
          },
          {
            path: 'produtos/novo',
            loadComponent: () =>
              import('./admin/pages/produtos/produto-form/produto-form.component').then(
                (m) => m.ProdutoFormComponent,
              ),
          },
          {
            path: 'produtos/:id/editar',
            loadComponent: () =>
              import('./admin/pages/produtos/produto-form/produto-form.component').then(
                (m) => m.ProdutoFormComponent,
              ),
          },
          {
            path: 'produtos/:id',
            loadComponent: () =>
              import('./admin/pages/produtos/produto-detalhes/produto-detalhes.component').then(
                (m) => m.ProdutoDetalhesComponent,
              ),
          },
        ],
      },
    ],
  },

  // Rota para páginas não encontradas
  { path: '**', redirectTo: '/' },
];
