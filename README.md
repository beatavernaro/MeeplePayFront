# Comanda Virtual - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Componentes Principais](#componentes-principais)
6. [Serviços](#serviços)
7. [Models e Interfaces](#models-e-interfaces)
8. [Segurança e Autenticação](#segurança-e-autenticação)
9. [Fluxo de Dados](#fluxo-de-dados)
10. [Funcionalidades Principais](#funcionalidades-principais)
11. [Armazenamento de Dados](#armazenamento-de-dados)

---

## Visão Geral

### O que é o Comanda Virtual?

O **Comanda Virtual** é um sistema web moderno que permite aos clientes de um estabelecimento (Luderia) realizarem pedidos através de uma interface digital, eliminando a necessidade de atendimento presencial. O sistema é composto por duas interfaces principais:

#### Interface Pública (Clientes)
- Página de entrada para iniciar uma comanda
- Visualização do cardápio com produtos disponíveis
- Carrinho de compras com gerenciamento de itens
- Realização de pedidos com identificação básica (nome e celular)

#### Interface Administrativa
- Dashboard com visão geral dos pedidos
- Gerenciamento de comandas (visualização, edição, encerramento)
- Gerenciamento de produtos (CRUD - Create, Read, Update, Delete)
- Autenticação segura para administradores

### Objetivo Principal

Modernizar o processo de atendimento em um estabelecimento, permitindo que clientes façam pedidos de forma independente através de uma plataforma digital, enquanto administradores gerenciam os pedidos e o catálogo de produtos.

---

## Tecnologias Utilizadas

### Frontend
- **Angular 21.1.0** - Framework principal para construção da SPA (Single Page Application)
- **TypeScript 5.9.2** - Linguagem de programação com tipagem estática
- **RxJS 7.8.0** - Biblioteca para programação reativa
- **Angular Material 21.1.0** - Biblioteca de componentes UI pré-built
- **SCSS** - Pré-processador CSS para estilização

### Dependências Principais
- `@angular/animations` - Animações nativas Angular
- `@angular/cdk` - Component Dev Kit para funcionalidades avançadas
- `@angular/forms` - Formulários reeativos e template-driven
- `@angular/router` - Roteamento de aplicação
- `@angular/platform-browser` - Plataforma navegador

### Ferramentas de Desenvolvimento
- **Vitest 4.0.8** - Framework de testes unitários (ES modules)
- **Angular CLI 21.1.0** - Ferramenta de linha de comando para Angular
- **npm 10.9.2** - Gerenciador de pacotes

### Arquitetura Complementar
- **API Backend** - ASP.NET Core (externa)
  - URLs: 
    - Desenvolvimento: `https://localhost:7000/api`
    - Produção: `https://comanda-virtual-api.azurewebsites.net/api`

---

## Arquitetura do Sistema

### Padrão Arquitetural

O projeto segue a **arquitetura de módulos** com separação clara de responsabilidades:

```
App (Root)
├── Admin (Protected Routes)
│   ├── Login Component
│   ├── Layout (Protected)
│   │   ├── Dashboard
│   │   ├── Comandas Management
│   │   │   └── Comanda Detalhes
│   │   └── Produtos Management
│   │       ├── Produto Detalhes
│   │       └── Produto Form
│   │
├── Public (Cliente Facing)
│   ├── Landing (Homepage)
│   ├── Start (Iniciar Comanda)
│   ├── Cardápio (Visualizar Produtos) - Protected com SessionGuard
│   ├── Carrinho (Gerenciar Itens) - Protected com SessionGuard
│   └── Encerrada (Confirmação)
│
├── Core (Serviços e Lógica Compartilhada)
│   ├── Services
│   │   ├── ComandaService
│   │   ├── ProdutoService
│   │   ├── AdminAuthService
│   │   └── SessaoClienteService
│   ├── Guards
│   │   ├── AdminAuthGuard
│   │   └── SessionGuard
│   └── Interceptors
│       └── AuthInterceptor
│
└── Shared (Componentes e Models Reutilizáveis)
    ├── Models
    │   ├── api.interfaces.ts
    │   ├── comanda.model.ts
    │   ├── produto.model.ts
    │   └── item-comanda.model.ts
    └── Components
        ├── header
        └── confirm-dialog
```

### Fluxo de Requisições HTTP

1. **Componente** faz chamada a um **Serviço**
2. **Serviço** utiliza `HttpClient` para fazer requisições HTTP
3. **AuthInterceptor** intercepta a requisição
   - Identifica o tipo de endpoint (admin, user, public)
   - Injeta o token de autenticação apropriado
   - Trata erros globalmente
4. **API Backend** processa a requisição
5. **Serviço** processa a resposta
   - Transforma dados com `map()`
   - Trata erros com `catchError()`
   - Atualiza BehaviorSubjects
6. **Componente** se inscreve no Observable
   - Exibe dados na view
   - Reage a mudanças

---

## Estrutura de Pastas

### Estrutura Hierárquica Detalhada

```
src/
├── app/
│   ├── admin/                          # Módulo administrativo
│   │   ├── layout/
│   │   │   ├── admin-layout.component.ts
│   │   │   └── admin-layout.component.scss
│   │   │
│   │   └── pages/
│   │       ├── comandas/               # Gerenciamento de comandas
│   │       │   ├── comandas.component.ts
│   │       │   ├── comandas.component.html
│   │       │   ├── comandas.component.scss
│   │       │   └── comanda-detalhes/
│   │       │       ├── comanda-detalhes.component.ts
│   │       │       └── comanda-detalhes.component.scss
│   │       │
│   │       ├── dashboard/              # Dashboard administrativo
│   │       │   ├── dashboard.component.ts
│   │       │   ├── dashboard.component.html
│   │       │   └── dashboard.component.scss
│   │       │
│   │       ├── login/                  # Autenticação admin
│   │       │   ├── login.component.ts
│   │       │   ├── login.component.html
│   │       │   └── login.component.scss
│   │       │
│   │       └── produtos/               # Gerenciamento de produtos
│   │           ├── produtos.component.ts
│   │           ├── produto-detalhes/
│   │           │   └── produto-detalhes.component.ts
│   │           ├── produto-form/
│   │           │   └── produto-form.component.ts
│   │           └── produto-form-dialog/
│   │
│   ├── core/                           # Serviços, Guards, Interceptors
│   │   ├── guards/
│   │   │   ├── admin-auth.guard.ts     # Verifica autenticação admin
│   │   │   └── session.guard.ts        # Verifica sessão de usuário
│   │   │
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts     # Adiciona token às requisições
│   │   │
│   │   └── services/
│   │       ├── admin-auth.service.ts   # Autenticação admin
│   │       ├── comanda.service.ts      # Operações com comandas
│   │       ├── sessao-cliente.service.ts # Sessão do cliente (token + comanda, 6h)
│   │       └── produto.service.ts      # Operações com produtos
│   │
│   ├── public/                         # Módulo público (clientes)
│   │   └── pages/
│   │       ├── cardapio/               # Visualização do cardápio
│   │       │   ├── cardapio.component.ts
│   │       │   ├── cardapio.component.html
│   │       │   └── cardapio.component.scss
│   │       │
│   │       ├── carrinho/               # Gerenciamento do carrinho
│   │       │   ├── carrinho.component.ts
│   │       │   ├── carrinho.component.html
│   │       │   └── carrinho.component.scss
│   │       │
│   │       ├── encerrada/              # Tela de confirmação
│   │       │   ├── encerrada.component.ts
│   │       │   ├── encerrada.component.html
│   │       │   └── encerrada.component.scss
│   │       │
│   │       ├── landing/                # Homepage
│   │       │   ├── landing.component.ts
│   │       │   ├── landing.component.html
│   │       │   └── landing.component.scss
│   │       │
│   │       └── start/                  # Iniciar comanda
│   │           ├── start.component.ts
│   │           ├── start.component.html
│   │           └── start.component.scss
│   │
│   ├── shared/                         # Componentes e modelos compartilhados
│   │   ├── components/
│   │   │   ├── confirm-dialog/         # Dialog de confirmação
│   │   │   │   └── confirm-dialog.component.ts
│   │   │   └── header/                 # Header compartilhado
│   │   │       ├── header.component.ts
│   │   │       └── header.component.scss
│   │   │
│   │   └── models/
│   │       ├── api.interfaces.ts       # Interfaces da API
│   │       ├── comanda.model.ts        # Model de comanda
│   │       ├── item-comanda.model.ts   # Model de item
│   │       └── produto.model.ts        # Model de produto
│   │
│   ├── app.ts                          # Component raiz
│   ├── app.html                        # Template raiz
│   ├── app.scss                        # Estilos globais
│   ├── app.routes.ts                   # Definição de rotas
│   ├── app.config.ts                   # Configuração da app
│   └── app.spec.ts                     # Testes do app
│
├── assets/                             # Arquivos estáticos
├── environments/                       # Configuração por ambiente
│   ├── environment.ts                  # Desenvolvimento
│   └── environment.prod.ts             # Produção
│
├── index.html                          # HTML principal
├── main.ts                             # Entry point
└── styles.scss                         # Estilos globais

public/                                 # Arquivos estáticos servidos
├── _redirects                          # Redirecionamentos (SPA)
├── staticwebapp.config.json            # Configuração Azure
└── web.config                          # Configuração IIS
```

### Convenções de Nomenclatura

- **Componentes**: `nome.component.ts` (com template e stylesheet)
- **Serviços**: `nome.service.ts`
- **Guards**: `nome.guard.ts`
- **Interceptors**: `nome.interceptor.ts`
- **Modelos**: `nome.model.ts`
- **Interfaces**: `nome.interfaces.ts`
- **Testes**: `nome.spec.ts`

---

## Componentes Principais

### 1. **Landing Component** (`public/pages/landing/`)
- **Propósito**: Página inicial da aplicação
- **Protected**: Não (público)
- **Funcionalidades**:
  - Apresentação do sistema
  - Botão para iniciar uma comanda
  - Informações gerais sobre o Luderia

### 2. **Start Component** (`public/pages/start/`)
- **Propósito**: Iniciar uma nova sessão de comanda
- **Protected**: Não (público)
- **Funcionalidades**:
  - Formulário com nome do cliente e celular
  - Validação de entrada
  - Busca ou criação de comanda
  - Armazenamento de dados da sessão

### 3. **Cardápio Component** (`public/pages/cardapio/`)
- **Propósito**: Visualizar produtos disponíveis
- **Protected**: Sim (SessionGuard)
- **Funcionalidades**:
  - Listar produtos ativos da API
  - Filtro por categoria (se implementado)
  - Busca de produtos
  - Adicionar itens ao carrinho
  - Visualização de preços e descrições

### 4. **Carrinho Component** (`public/pages/carrinho/`)
- **Propósito**: Gerenciar itens do pedido
- **Protected**: Sim (SessionGuard)
- **Funcionalidades**:
  - Listar itens adicionados
  - Atualizar quantidade de itens
  - Remover itens
  - Calcular total do pedido
  - Confirmar/encerrar comanda

### 5. **Admin Layout Component** (`admin/layout/`)
- **Propósito**: Layout estrutural da seção admin
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Menu de navegação
  - Header com informações de admin
  - Router outlet para subrotas
  - Logout

### 6. **Admin Dashboard Component** (`admin/pages/dashboard/`)
- **Propósito**: Visão geral dos dados administrativos
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Estatísticas de vendas
  - Comandas recentes/abertas
  - Gráficos de desempenho
  - KPIs do negócio

### 7. **Admin Comandas Component** (`admin/pages/comandas/`)
- **Propósito**: Listar e gerenciar todas as comandas
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Listar comandas com filtros (status, data)
  - Visualizar resumo das comandas
  - Navegar para detalhes de comanda
  - Encerrar comandas

### 8. **Comanda Detalhes Component** (`admin/pages/comandas/comanda-detalhes/`)
- **Propósito**: Visualizar e gerenciar detalhes de uma comanda específica
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Exibir informações completas da comanda
  - Listar itens da comanda
  - Adicionar/remover itens manualmente
  - Editar observações
  - Atualizar status
  - Calcular e exibir total

### 9. **Admin Produtos Component** (`admin/pages/produtos/`)
- **Propósito**: Listar e gerenciar catálogo de produtos
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Listar todos os produtos
  - Filtrar por status (ativo/inativo)
  - Buscar produtos
  - Botão para criar novo produto
  - Navegar para edição/detalhes

### 10. **Produto Form Component** (`admin/pages/produtos/produto-form/`)
- **Propósito**: Criar ou editar um produto
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Formulário reativo com validações
  - Campos: nome, descrição, preço, categoria
  - Modo novo ou edição (baseado em rota)
  - Salvar ao backend
  - Feedback de sucesso/erro

### 11. **Produto Detalhes Component** (`admin/pages/produtos/produto-detalhes/`)
- **Propósito**: Visualizar detalhes de um produto
- **Protected**: Sim (AdminAuthGuard)
- **Funcionalidades**:
  - Exibir todas as informações do produto
  - Botão para editar
  - Botão para ativar/desativar
  - Botão para deletar
  - Histórico de alterações (se implementado)

### 12. **Admin Login Component** (`admin/pages/login/`)
- **Propósito**: Autenticação de administradores
- **Protected**: Não (público)
- **Funcionalidades**:
  - Formulário de login
  - Validação de credenciais
  - Armazenamento do token JWT
  - Redirecionamento após sucesso
  - Tratamento de erros

---

## Serviços

### 1. **ComandaService**
**Localização**: `core/services/comanda.service.ts`

**Responsabilidades**:
- Gerenciar estado e operações de comandas
- Comunicação com API de comandas
- Transformação de dados

**Métodos Principais**:

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|----------|-----------|
| `obterTodasComandas()` | `filtros?` | `Observable<ComandaResumo[]>` | Lista todas as comandas com filtros opcionais |
| `obterComandasCompletas()` | `filtros?` | `Observable<Comanda[]>` | Lista comandas com dados completos |
| `buscarComandaPorCelular()` | `celular: string` | `Observable<Comanda \| null>` | Busca comanda aberta pelo celular |
| `reconectarComanda()` | `nomeCliente, celular` | `Observable<Comanda>` | Reconecta a uma comanda existente |
| `criarComanda()` | `CreateComandaRequest` | `Observable<CreateComandaResponse>` | Cria nova comanda |
| `obterComanda()` | `id: string` | `Observable<Comanda>` | Obtém comanda por ID |
| `encerrarComanda()` | `id: string` | `Observable<Comanda>` | Encerra uma comanda |
| `adicionarItemComanda()` | `CreateItemComandaRequest` | `Observable<ItemComanda>` | Adiciona item à comanda |
| `atualizarItemComanda()` | `id: string, request` | `Observable<ItemComanda>` | Atualiza quantidade de item |
| `removerItemComanda()` | `id: string` | `Observable<void>` | Remove item da comanda |

**BehaviorSubjects** (Estado Reativo):
- `comandaAtual$` - Comanda atualmente em edição
- `itensComanda$` - Itens da comanda atual

**Características**:
- Utiliza RxJS para operações assíncronas
- Mapeia respostas da API para modelos locais
- Trata erros HTTP automaticamente
- Atualiza automaticamente estado local com respostas

---

### 2. **ProdutoService**
**Localização**: `core/services/produto.service.ts`

**Responsabilidades**:
- Gerenciar operações de produtos
- Comunicação com API de produtos

**Métodos Principais**:

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|----------|-----------|
| `obterProdutosAtivos()` | - | `Observable<Produto[]>` | Lista produtos ativos (público) |
| `obterTodosProdutos()` | - | `Observable<Produto[]>` | Lista todos os produtos (admin) |
| `obterProdutoPorId()` | `id: string` | `Observable<Produto>` | Obtém produto por ID |
| `criarProduto()` | `CreateProdutoRequest` | `Observable<Produto>` | Cria novo produto |
| `atualizarProduto()` | `id, updates` | `Observable<Produto>` | Atualiza dados do produto |
| `desativarProduto()` | `id: string` | `Observable<void>` | Desativa um produto |

**Tratamento de Erros**:
- 401 - Token expirado/inválido (redireciona para login)
- 403 - Acesso negado
- 404 - Produto não encontrado
- 400 - Dados inválidos
- 5xx - Erro interno do servidor
- 0 - Erro de conexão

---

### 3. **AdminAuthService**
**Localização**: `core/services/admin-auth.service.ts`

**Responsabilidades**:
- Autenticação de administradores
- Gerenciamento de tokens admin
- Verificação de autenticação

**Métodos Principais**:

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|----------|-----------|
| `login()` | `email, password` | `Observable<LoginResponse>` | Autentica admin e obtém token |
| `register()` | `email, password, nome` | `Observable<RegisterResponse>` | Cria novo admin |
| `logout()` | - | `void` | Desautentica e limpa token |
| `isAuthenticated()` | - | `boolean` | Verifica se admin está autenticado |
| `getToken()` | - | `string \| null` | Obtém token armazenado |

**BehaviorSubjects**:
- `isAuthenticated$` - Estado de autenticação

**Armazenamento**:
- Token salvo em `localStorage` com chave `adminToken`

---

### 4. **SessaoClienteService**
**Localização**: `core/services/sessao-cliente.service.ts`

**Responsabilidades**:
- Guardar o token JWT e o id da comanda do cliente para recuperar a comanda ao recarregar a página

**Métodos**:

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|----------|-----------|
| `getAccessToken()` | - | `string \| null` | Token atual do cliente |
| `getComandaId()` | - | `string \| null` | Id da comanda da sessão |
| `iniciar()` | `accessToken, comandaId` | `void` | Salva a sessão (válida por 6 horas) |
| `limpar()` | - | `void` | Remove a sessão |

**Armazenamento**:
- `localStorage`, chave `meeplepay_sessao_cliente`: `{ accessToken, comandaId, expiraEm }`
- Expira 6 horas depois de o cliente entrar; sessão expirada ou ilegível é apagada
- Só serve para recuperar a comanda: os dados da comanda sempre vêm do backend, e a tela inicial sempre consulta pelo celular digitado
- A expiração do token (24h) é validada pela API; um 401 leva o cliente de volta para `/start`

**Dados Armazenados** (UserData):
```typescript
{
  nomeCliente: string;
  celular: string;
  comandaId?: string | number;
  lastActivity?: string;        // ISO timestamp
  accessToken?: string;         // JWT
  tokenExpiration?: string;    // ISO timestamp
}
```

---

## Models e Interfaces

### 1. **API Interfaces** (`shared/models/api.interfaces.ts`)

#### ComandaStatus
```typescript
type ComandaStatus = 'ABERTA' | 'ENCERRADA';
```

#### Comanda
Interface principal que representa uma comanda:
```typescript
interface Comanda {
  id: string;
  nomeCliente: string;
  celular: string;
  status: string;               // 'ABERTA' ou 'ENCERRADA'
  valorTotal: number;
  total: number;
  dataCriacao: string;          // ISO datetime
  dataEncerramento: string | null;
  observacoes?: string;
  itens?: ItemComanda[];
}
```

#### CreateComandaRequest / Response
```typescript
interface CreateComandaRequest {
  nomeCliente: string;
  celular: string;
  observacoes?: string;
}

interface CreateComandaResponse {
  comanda: Comanda;
  accessToken: string;          // JWT para sessão
  message: string;
}
```

#### ItemComanda
Representa um item dentro de uma comanda:
```typescript
interface ItemComanda {
  id: string;
  comandaId: string;
  produtoId: string | null;
  nome: string;
  valorUnitario: number;
  quantidade: number;
  origem: string;               // 'LISTA' ou 'ADICIONADO'
}
```

#### Produto
```typescript
interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ativo: boolean;
}
```

#### Requests/Responses
```typescript
interface CreateProdutoRequest {
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
}

interface UpdateProdutoRequest {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
  ativo?: boolean;
}
```

#### Autenticação
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  nome: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
}
```

#### Erro
```typescript
interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
}
```

### 2. **Comanda Model** (`shared/models/comanda.model.ts`)

```typescript
interface Comanda extends ApiComanda {}

interface ComandaResumo {
  id: string;
  nomeCliente: string;
  valorTotal: number;
  quantidadeItens: number;
  status: string;
  dataCriacao: string;
}
```

**Uso**: ComandaResumo é usada em listas (menos dados) e Comanda em detalhes (dados completos).

### 3. **Produto Model** (`shared/models/produto.model.ts`)

```typescript
interface Produto extends ApiProduto {}

interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
}
```

### 4. **Item Comanda Model** (`shared/models/item-comanda.model.ts`)

Re-exporta ItemComanda do api.interfaces para facilitar imports.

---

## Segurança e Autenticação

### Sistema de Autenticação de Dois Níveis

O sistema implementa dois níveis distintos de autenticação:

#### 1. **Autenticação de Cliente (Session)**
- **Tipo**: JWT (JSON Web Token)
- **Armazenamento**: `localStorage` com token e id da comanda (SessaoClienteService)
- **Duração**: 6 horas (o token expira em 24 horas na API); recarregar a página recupera a comanda
- **Fluxo**:
  1. Cliente insere nome e celular na tela de start ("Acessar Comanda")
  2. `POST /api/comandas/reconectar`: se houver comanda aberta para o celular, ela é recuperada (com o nome salvo nela)
  3. Se a API responder 404, `POST /api/comandas` cria uma nova
  4. A API retorna um JWT único para essa comanda, salvo por 6 horas junto com o id da comanda
  5. Usado em requisições para produtos, itens, etc.

#### 2. **Autenticação Admin (Admin JWT)**
- **Tipo**: JWT (JSON Web Token)
- **Armazenamento**: `localStorage` (AdminAuthService)
- **Duração**: Persistente até logout
- **Fluxo**:
  1. Admin insere email e senha na página de login
  2. Sistema envia credenciais para API
  3. API valida e retorna JWT admin
  4. Token salvo em localStorage
  5. Usado para todas as requisições admin

### Guards de Rota

#### **AdminAuthGuard**
**Localização**: `core/guards/admin-auth.guard.ts`

Verifica autenticação admin antes de acessar rotas protegidas:
- ✅ Se autenticado: Permite acesso
- ❌ Se não autenticado: Redireciona para `/admin/login`

**Rotas Protegidas**:
- `/admin/` (todas as subrotas exceto /admin/login)

#### **SessionGuard**
**Localização**: `core/guards/session.guard.ts`

Verifica se usuário tem sessão válida:
- ✅ Se tem dados válidos: Permite acesso
- ❌ Se não tem: Redireciona para `/start`
- Atualiza timestamp da última atividade

**Rotas Protegidas**:
- `/cardapio`
- `/carrinho`

### AuthInterceptor

**Localização**: `core/interceptors/auth.interceptor.ts`

Interceptor HTTP que:
1. **Identifica tipo de endpoint**:
   - Admin endpoints (`/api/admin`, `/api/auth`)
   - User auth endpoints (`/api/produtos`, `/api/itens-comanda`)
   - Public endpoints (`/api/comandas/celular/`, etc)

2. **Injeta token apropriado**:
   - Endpoints admin → Token admin
   - Endpoints user → Token de sessão
   - Endpoints públicos → Sem token

3. **Trata erros globalmente**:
   - 401: Token expirado → Redireciona para login
   - 403: Acesso negado
   - 404: Recurso não encontrado
   - 5xx: Erro de servidor

### Rotas Públicas vs Protegidas

| Rota | Tipo | Guard | Autenticação |
|------|------|-------|--------------|
| `/` | Landing | ❌ | Pública |
| `/start` | Iniciar comanda | ❌ | Pública |
| `/cardapio` | Cardápio | ✅ SessionGuard | Sessão cliente |
| `/carrinho` | Carrinho | ✅ SessionGuard | Sessão cliente |
| `/encerrada` | Confirmação | ❌ | Pública |
| `/admin/login` | Login admin | ❌ | Pública |
| `/admin/dashboard` | Dashboard | ✅ AdminAuthGuard | Admin |
| `/admin/comandas` | Comandas | ✅ AdminAuthGuard | Admin |
| `/admin/produtos` | Produtos | ✅ AdminAuthGuard | Admin |

---

## Fluxo de Dados

### Fluxo de Acesso à Comanda (Cliente)

```
Start Component
    ↓ (input: nome, celular)
ComandaService.acessarComanda()
    ↓
API Backend POST /api/comandas/reconectar
    ↓ 200: comanda aberta do celular   ↓ 404: nenhuma comanda aberta
    ↓                                  API Backend POST /api/comandas
    ↓
Retorna: { comanda, accessToken }
    ↓
ComandaService:
  - Guarda a comanda no estado (signal)
  - SessaoClienteService.iniciar(token, comandaId)
    ↓
Start Component:
  - Mostra "Comanda #N recuperada/criada"
  - Navega para /cardapio
  - SessionGuard exige comanda carregada e consulta o status na API
    ↓
Cardápio Component carrega produtos
```

### Fluxo de Adição de Item ao Carrinho

```
Cardápio Component
    ↓ (user clica "+")
ComandaService.adicionarItemComanda()
    ↓ (inclui comandaId, produtoId, quantidade)
AuthInterceptor (injeta token de sessão)
    ↓
API Backend POST /api/itens-comanda
    ↓
Retorna: ItemComanda
    ↓
ComandaService:
  - Atualiza itensComanda$ BehaviorSubject
    ↓
Cardápio Component reage à mudança em itensComanda$
    ↓
Carrinho Component também reage e exibe item
```

### Fluxo de Gerenciamento Admin

```
Admin Dashboard Component
    ↓
AdminAuthGuard verifica localStorage.adminToken
    ✅ Válido → carrega dados
    ❌ Inválido → redireciona para /admin/login
    ↓
ComandaService.obterComandasCompletas()
    ↓
AuthInterceptor (injeta token admin)
    ↓
API Backend GET /api/comandas
    ↓
Retorna: Comanda[]
    ↓
Dashboard atualiza dashboard com dados
```

### Fluxo de Atualização de Produto (Admin)

```
Produto Detalhes Component
    ↓ (admin clica "Editar")
Navega para /admin/produtos/:id/editar
    ↓
Produto Form Component carrega:
  - ProdutoService.obterProdutoPorId()
    ↓
AuthInterceptor (injeta token admin)
    ↓
API Backend GET /api/produtos/:id
    ↓
Form preenchido com dados
    ↓ (admin modifica e clica "Salvar")
ProdutoService.atualizarProduto()
    ↓
AuthInterceptor (injeta token admin)
    ↓
API Backend PUT /api/produtos/:id
    ↓
Sucesso → Navega de volta para /admin/produtos
Erro → Exibe mensagem de erro
```

---

## Funcionalidades Principais

### 1. **Fluxo de Cliente (Interface Pública)**

#### A. Iniciar Comanda
- Cliente acessa homepage (/)
- Clica em "Iniciar Comanda"
- Sistema exibe formulário com campos:
  - Nome do cliente
  - Número de celular
- Sistema valida dados
- Cria/busca comanda na API
- Armazena token JWT e dados localmente
- Redireciona para cardápio

#### B. Visualizar e Selecionar Produtos
- Cliente acessa `/cardapio`
- Sistema valida sessão (SessionGuard)
- Carrega produtos ativos da API
- Cliente visualiza:
  - Foto/ícone
  - Nome do produto
  - Descrição
  - Preço
  - Categoria (opcional)
- Cliente pode:
  - Adicionar produto ao carrinho
  - Especificar quantidade
  - Aplicar filtros
  - Buscar produtos

#### C. Gerenciar Carrinho
- Cliente acessa `/carrinho`
- Sistema exibe resumo dos itens:
  - Nome do item
  - Quantidade
  - Preço unitário e total
  - Subtotal
- Cliente pode:
  - Aumentar/diminuir quantidade de itens
  - Remover itens
  - Adicionar observações
  - Visualizar total
  - Confirmar pedido (encerrar comanda)

#### D. Confirmação
- Cliente clica "Confirmar Pedido"
- Sistema envia requisição para encerrar comanda
- Exibe página de confirmação com:
  - Número da comanda
  - Resumo do pedido
  - Total
  - Tempo estimado de preparo
- Cliente pode sair do sistema

### 2. **Interface Administrativa**

#### A. Autenticação Admin
- Admin acessa `/admin`
- É direcionado para `/admin/login`
- Insere email e senha
- Sistema valida credenciais
- Se válido:
  - Armazena token JWT
  - Redireciona para `/admin/dashboard`
- Se inválido:
  - Exibe mensagem de erro
  - Permite tenta novamente

#### B. Dashboard
- Exibe visão geral com:
  - Total de comandas abertas/fechadas
  - Receita total do período
  - Produtos mais vendidos
  - Últimas comandas
  - Gráficos de tráfego
  - KPIs importantes

#### C. Gerenciar Comandas
- Admin acessa `/admin/comandas`
- Exibe lista de todas as comandas com:
  - Nome do cliente
  - Status (Aberta/Encerrada)
  - Total do pedido
  - Data de criação
  - Ações (visualizar, encerrar)
- Pode filtrar por:
  - Status
  - Data de criação (range)
  - Nome do cliente
- Ao clicar em comanda → Detalhes completos:
  - Informações da comanda
  - Lista de itens (nome, quantidade, preço)
  - Cálculo total
  - Observações
  - Botão para encerrar
  - Botão para editar itens

#### D. Gerenciar Produtos
- Admin acessa `/admin/produtos`
- Exibe lista com:
  - Nome do produto
  - Categoria
  - Preço
  - Status (Ativo/Inativo)
  - Ações (editar, detalhes, ativar/desativar)
- Funções disponíveis:
  - **Criar novo**: Clica "Novo Produto" → Formulário
  - **Editar**: Clica "Editar" → Pré-preenchido
  - **Ver detalhes**: Exibe informações completas
  - **Ativar/Desativar**: Toggle de status
  - **Deletar**: Remove do sistema

#### E. Formulário de Produto
- Campos:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Preço (obrigatório, numérico)
  - Categoria (opcional)
- Validações:
  - Campos obrigatórios
  - Formato de preço
  - Comprimento de campos
- Botões:
  - Salvar (POST/PUT conforme criar/editar)
  - Cancelar (voltar à lista)

### 3. **Recursos Técnicos**

#### A. Validação de Sessão
- SessionGuard verifica:
  - Sessão do cliente: comanda carregada nesta página ou sessão salva há menos de 6h (senão, volta para /start)
  - Status atual da comanda na API, que também recupera a comanda após recarregar a página (encerrada ou paga vai para /encerrada)

#### B. Tratamento de Erros
- Erros HTTP tratados globalmente pelo interceptor
- Erros 401 → Redireciona para login
- Erros 403 → Exibe mensagem de acesso negado
- Erros 500+ → Exibe mensagem genérica
- Erros de conexão → Mensagem clara

#### C. Reatividade
- Uso de RxJS Observables
- BehaviorSubjects para estado compartilhado:
  - `comandaAtual$` - Comanda em edição
  - `itensComanda$` - Itens da comanda
  - `isAuthenticated$` - Estado de autenticação
- Componentes se inscrevem com `| async` pipe

---

## Armazenamento de Dados

### LocalStorage (Sessão do Cliente)
**Chave**: `meeplepay_sessao_cliente`

**Dados Armazenados**:
```json
{
  "accessToken": "eyJhbGc...",
  "comandaId": "abc123",
  "expiraEm": 1772462400000
}
```

**Características**:
- Válida por 6 horas a partir da entrada na comanda
- Permite recarregar a página sem perder a comanda (os dados são buscados de novo no backend)
- Limpa ao iniciar uma nova comanda, ao acessar outra pelo celular ou após 401/403

### LocalStorage (Dados do Admin)
**Chave**: `adminToken`

**Dados Armazenados**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Características**:
- Persiste entre sessões do navegador
- Removido apenas em logout explícito
- Necessário para acessar área admin

### Dados em Memória (BehaviorSubjects)
**Tipo**: RxJS Observables

**Dados**:
- `ComandaService.comandaAtual$` - Comanda sendo visualizada
- `ComandaService.itensComanda$` - Itens da comanda
- `AdminAuthService.isAuthenticated$` - Status autenticação

**Características**:
- Perdidos ao recarregar página
- Recarregados quando necessário
- Permitem reatividade automática

---

## Ambientes

### Arquivo de Configuração: `environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7000/api'  // Desenvolvimento
};
```

### Produção: `environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://comanda-virtual-api.azurewebsites.net/api'
};
```

### Build por Ambiente
```bash
# Desenvolvimento
ng serve

# Produção
ng build --configuration production
```

---

## Integração com API Backend

### URLs da API
- **Desenvolvimento**: `https://localhost:7000/api`
- **Produção**: `https://comanda-virtual-api.azurewebsites.net/api`

### Endpoints Principais

#### Comandas
```
POST   /api/comandas                    # Criar comanda
POST   /api/comandas/reconectar         # Reconectar comanda
GET    /api/comandas                    # Listar (admin)
GET    /api/comandas/:id                # Detalhes
GET    /api/comandas/celular/:celular   # Buscar por celular
PUT    /api/comandas/:id/encerrar       # Encerrar comanda
```

#### Itens da Comanda
```
POST   /api/itens-comanda               # Adicionar item
PUT    /api/itens-comanda/:id           # Atualizar item
DELETE /api/itens-comanda/:id           # Remover item
```

#### Produtos
```
GET    /api/produtos/ativos             # Listar ativos (público)
GET    /api/produtos                    # Listar todos (admin)
GET    /api/produtos/:id                # Detalhes
POST   /api/produtos                    # Criar (admin)
PUT    /api/produtos/:id                # Atualizar (admin)
PUT    /api/produtos/:id/desativar      # Desativar (admin)
```

#### Autenticação
```
POST   /api/auth/login                  # Login admin
POST   /api/auth/register               # Registrar admin
```

### Formato de Requisições

**Exemplo: Criar Comanda**
```http
POST /api/comandas
Content-Type: application/json

{
  "nomeCliente": "João Silva",
  "celular": "11999999999",
  "observacoes": "Com gelo"
}
```

**Resposta Sucesso (201)**:
```json
{
  "comanda": {
    "id": "abc123",
    "nomeCliente": "João Silva",
    "celular": "11999999999",
    "status": "ABERTA",
    "valorTotal": 0,
    "total": 0,
    "dataCriacao": "2026-03-02T14:30:00Z",
    "dataEncerramento": null,
    "observacoes": "Com gelo",
    "itens": []
  },
  "accessToken": "eyJhbGc...",
  "message": "Comanda criada com sucesso"
}
```

---

## Deploying para Produção

### Azure Static Web Apps

O projeto está configurado para deploy na plataforma **Azure Static Web Apps**:

**Arquivos de Configuração**:
- `public/staticwebapp.config.json` - Configuração Azure SWA
- `public/_redirects` - Redirecionamentos para SPA
- `public/web.config` - Configuração IIS (fallback)

**Build Output**:
```
dist/comanda-virtual/browser/
```

**URL de Produção**:
```
https://comanda-virtual-api.azurewebsites.net
```

### Configuração de Deploy
1. Build otimizado: `ng build --configuration production`
2. Arquivos minificados e bundle tree-shaken
3. Source maps removidos em produção
4. Configuração de cache via web.config
5. Redirecionamentos SPA configurados

---

## Testes

### Framework: Vitest

**Executar testes**:
```bash
ng test
```

**Arquivo de Teste**:
- `app.spec.ts` - Testes do componente raiz
- Seguem padrão Angular com Vitest

**Exemplo de Teste**:
```typescript
describe('App Component', () => {
  it('should create', () => {
    // test logic
  });
});
```

---

## Considerações Importantes

### Performance
- Lazy loading de módulos por rota (componentes carregados sob demanda)
- Tree-shaking em build de produção
- OnPush change detection (se implementado)
- Pipes assíncronos para Observables

### Segurança
- JWT para autenticação
- HTTPS obrigatório em produção
- CORS configurado no backend
- Sessão do cliente expira em 6 horas (só token e id da comanda)
- Tokens expiram automaticamente

### Escalabilidade
- Serviços reutilizáveis e injetáveis
- Componentes standalone (Angular 21)
- Separação clara de responsabilidades
- Fácil adicionar novos endpoints/serviços

### Manutenibilidade
- Código TypeScript com tipagem forte
- Nomes de variáveis e funções descritos
- Comentários em métodos complexos
- Convenções de nomenclatura consistentes
- Estrutura modular bem organizada

---

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   ANGULAR 21 SPA                             │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │  Public Routes   │         │   Admin Routes       │      │
│  ├──────────────────┤         ├──────────────────────┤      │
│  │ - Landing        │         │ - Login              │      │
│  │ - Start          │         │ - Dashboard          │      │
│  │ - Cardápio       │◄──────► │ - Comandas           │      │
│  │ - Carrinho       │         │ - Produtos           │      │
│  │ - Encerrada      │         └──────────────────────┘      │
│  └──────────────────┘                                        │
│          ▲                                                    │
│          │ (SessionGuard)                                    │
│          ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            CORE SERVICES                             │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │    │
│  │  │ ComandaService  │  │ ProdutoService          │   │    │
│  │  ├─────────────────┤  ├─────────────────────────┤   │    │
│  │  │ - criarComanda  │  │ - obterProdutos         │   │    │
│  │  │ - buscarComanda │  │ - criarProduto          │   │    │
│  │  │ - adicionar item│  │ - atualizarProduto      │   │    │
│  │  │ - encerrar      │  │ - desativarProduto      │   │    │
│  │  └─────────────────┘  └─────────────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐ │    │
│  │  │ AdminAuthService     │  │ SessaoClienteService │ │    │
│  │  ├──────────────────────┤  ├──────────────────────┤ │    │
│  │  │ - login              │  │ - iniciar            │ │    │
│  │  │ - logout             │  │ - getAccessToken     │ │    │
│  │  │ - isAuthenticated    │  │ - limpar             │ │    │
│  │  └──────────────────────┘  └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│          ▲                                                    │
│          │ (AuthInterceptor)                                 │
│          ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         HttpClient + AuthInterceptor                 │    │
│  │  ├─ Injeta token apropriado                          │    │
│  │  ├─ Trata erros globalmente                          │    │
│  │  └─ Mapeia respostas para models                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
        ▲                                                       
        │ HTTPS                                                
        ▼                                                       
┌─────────────────────────────────────────────────────────────┐
│       ASP.NET CORE API Backend                               │
│  - Autenticação e Autorização                               │
│  - CRUD de Comandas, Itens e Produtos                       │
│  - Validação de dados                                       │
│  - Persistência em banco de dados                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo Executivo

O **Comanda Virtual** é uma aplicação web moderna desenvolvida em **Angular 21** que revoluciona o processo de atendimento em estabelecimentos. A arquitetura foi projetada com:

✅ **Separação clara de responsabilidades** através de serviços reutilizáveis
✅ **Segurança em dois níveis** com JWT para clientes e admins
✅ **Reatividade completa** utilizando RxJS Observables
✅ **Lazy loading** de rotas para performance otimizada
✅ **Tratamento robusto** de erros e edge cases
✅ **Sessão do cliente de 6 horas** e token do admin em LocalStorage
✅ **Experiência mobile-first** com Material Design

A plataforma está pronta para produção e integrada com API backend robusta, oferecendo uma solução completa para modernizar a experiência de atendimento.

