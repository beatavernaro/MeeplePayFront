# MeeplePay (front)

Front da comanda digital da luderia, em Angular. O cliente informa nome e celular, navega pelo cardápio, monta o carrinho e acompanha a própria comanda. O admin usa um painel para gerenciar comandas e produtos. A API fica em [MeeplePayBack](https://github.com/beatavernaro/MeeplePayBack).

## Telas

**Cliente**

| Rota | Tela |
| --- | --- |
| `/` | Página inicial |
| `/start` | Nome e celular; abre uma comanda nova ou volta para a comanda aberta desse celular |
| `/cardapio` | Produtos ativos, com busca e filtro por categoria |
| `/carrinho` | Itens da comanda, ajuste de quantidades e encerramento |
| `/encerrada` | Aviso de comanda encerrada (com a chave Pix para pagar) ou paga |

`/cardapio` e `/carrinho` exigem uma comanda ativa (`sessionGuard`).

**Admin** (exige login, `adminAuthGuard`)

| Rota | Tela |
| --- | --- |
| `/admin/login` | Login do administrador |
| `/admin/dashboard` | Totais de comandas e receita, comandas em andamento e últimas finalizadas |
| `/admin/comandas` | Comandas por status, com busca por nº ou celular e paginação feita na API |
| `/admin/comandas/:id` | Itens da comanda, encerramento e confirmação de pagamento |
| `/admin/produtos` | Lista de produtos e estoque |
| `/admin/produtos/novo`, `/admin/produtos/:id/editar` | Cadastro e edição de produto |
| `/admin/produtos/:id` | Detalhes e estatísticas de vendas do produto |

## Stack

- Angular 21 com componentes standalone, signals e rotas com lazy loading
- Angular Material 21 e ícones [lucide-angular](https://lucide.dev)
- RxJS 7.8 e TypeScript 5.9
- Testes com Vitest 4 (builder `@angular/build:unit-test`) e jsdom

## Como rodar

Pré-requisitos: Node.js e npm (o `package.json` declara `npm@10.9.2`).

```bash
npm install
npm start          # ng serve em http://localhost:4200
```

O `npm start` usa `src/environments/environment.ts`, que aponta para a API de DEV (`https://meeplepayback-dev.onrender.com/api`). Para usar uma API local, troque o `apiUrl` nesse arquivo. A API precisa liberar `http://localhost:4200` no CORS, e o back já libera por padrão.

Outros scripts:

```bash
npm test           # testes unitários (Vitest)
npm run build      # build de produção em dist/
npm run build:hml  # build com o environment de DEV
npm run start:hml  # ng serve com o environment de DEV
```

## Ambientes

| Arquivo | Usado em | `apiUrl` |
| --- | --- | --- |
| `environment.ts` | `npm start` | API de DEV no Render |
| `environment.hml.ts` | configuração `hml` (`build:hml`, `start:hml`) | API de DEV no Render |
| `environment.prod.ts` | build de produção | `https://api.meeplepay.com.br/api` |

Os environments também guardam os dados do Pix mostrados em `/encerrada`.

Na Vercel, o [vercel.json](vercel.json) escolhe o build pela variável `VERCEL_ENV`: `production` roda `npm run build`, e os previews (como a branch `develop`) rodam `npm run build:hml`.

## Estrutura

```text
src/app/
  public/pages/   telas do cliente (landing, start, cardapio, carrinho, encerrada)
  admin/          layout e telas do painel (dashboard, comandas, produtos, login)
  core/           services da API, guards e AuthInterceptor
  shared/         componentes (header, footer-nav, confirm-dialog), interfaces da API, ícones e textos do paginador
```

O `AuthInterceptor` envia o token certo em cada chamada: de cliente nas telas públicas e de admin no painel. Ele também trata os erros 401 e 403.

## Documentação

O [DOCUMENTACAO.md](DOCUMENTACAO.md) descreve em detalhe os componentes, services, models, guards e fluxos de dados.
