---
# Documento: Arquitetura de Software e Estrutura de Repositório
Área: Engenharia de Software e Padrões de Código
Data de geração: 2026-09-12
Status: Rascunho
Fontes utilizadas: Revisor de Código Sênior, package.json, Modelo Entidade-Relacionamento
---

Este documento delineia a infraestrutura tecnológica do projeto, mapeando o _stack_ operacional, a topologia de diretórios e as diretrizes arquiteturais que governam a aplicação.

## 1. Stack Tecnológica e Ferramental

A plataforma adota um ecossistema estritamente tipado, garantindo alta performance e separação de responsabilidades (Terminal Burro vs. Servidor Fonte da Verdade):

- **Backend (A Única Fonte da Verdade):**
  - **Framework:** NestJS 11.
  - **Persistência de Dados:** Prisma ORM 7 operando sobre PostgreSQL.
  - **API e Comunicação:** GraphQL com Apollo Server.
  - **Autenticação:** Supabase Auth (Segurança delegada).
- **Frontend (Orquestrador Visual e Reativo):**
  - **Biblioteca Core:** React 19 empacotado e otimizado pelo Vite.
  - **Gerenciamento de Estado/Rede:** Apollo Client v4.2.7.
  - **Estilização:** TailwindCSS v4 (implementação via variáveis CSS nativas, sem a diretriz legada `@apply`).
  - **Tipagem Dinâmica:** GraphQL Codegen executando com vigilância contínua na AST.

## 2. Divisão de Pastas e Topologia (`api-srs-backend/src/`)

A arquitetura do _backend_ reflete o Princípio de Responsabilidade Única (SRP), isolando domínios de negócio:

- `auth/`: Contém os _Guards_ de interceptação do GraphQL e os extratores de contexto (ex: _decorator_ que valida o JWT do Supabase).
- `common/`: Módulos e serviços utilitários transversais. Destaca-se o `RolloverService`, responsável por encapsular as regras matemáticas de deslocamento temporal (Offset de 4h para virada do ciclo de estudos).
- `deck/`, `flashcard/`, `study/`, `user/`: Diretórios base do domínio. Cada um abriga a tríade modular do NestJS: Módulo, Serviço (Regras de Negócio) e _Resolver_ (Controlador GraphQL), além dos modelos do banco e DTOs de transporte.

## 3. Decisões Arquiteturais e Padrões de Código

As engrenagens de comunicação entre cliente e servidor foram construídas sobre princípios defensivos estabelecidos na revisão de código do projeto:

- **Zero-Overfetching (TypePolicy):** O _frontend_ é proibido de buscar grandes coleções de dados apenas para contagem. Agregações estáticas são interceptadas pelo cache do Apollo Client, que deriva o valor instantaneamente do tamanho da matriz em memória RAM, prevenindo a dessincronia visual (_Stale Cache_).
- **Defesa na Fronteira (Guards e ValidationPipe):** O _backend_ rejeita tentativas de _Mass Assignment_. Todo DTO que adentra o GraphQL passa pelo `ValidationPipe` do NestJS (com `whitelist` e `forbidNonWhitelisted` ativos). Erros crus do banco são mascarados via _Exception Filters_ globais para evitar o vazamento da topologia do PostgreSQL.
- **Supabase Auth Delegado:** A plataforma desvia o esforço de criptografia de senhas para o Supabase. O _backend_ atua apenas lendo e autorizando as sessões criptografadas nas rotas privadas.
- **Transição de Estado Síncrona:** Operações de resposta (_ratings_) e edição aplicam Mutações Otimistas (_Optimistic UI_). O cache local é modificado e a interface avança instantaneamente, eliminando telas de carregamento intermediárias (Latência Zero) e mantendo a fluidez cognitiva do usuário.
- **Gamificação Silenciosa:** O serviço de estudos (`study.service.ts`) não se limita ao agendamento FSRS. Ele aplica ativamente a mecânica de engajamento injetando pontos de experiência durante o método `submitReview`, mapeado sob o critério: `RATING_XP_MAP = { 1: 3, 2: 5, 3: 10, 4: 15 }`.

## 4. Destinação de Dependências (`package.json`)

O uso dos pacotes é estritamente controlado para evitar código morto e inchaço no _bundle_:

- **Motor Visual e Parsing:** Bibliotecas como `react-markdown`, `remark-math` e `rehype-katex` estão fisicamente contidas em _Error Boundaries_ isolados (componente `MarkdownRenderer`). Uma falha na formatação de uma fórmula matemática não colapsa a árvore principal do React.
- **Ferramental Contínuo (Continuous DX):** Pacotes de codegen (`@graphql-codegen/cli` e `client-preset`) alimentam o script de desenvolvimento `generate:watch`, recriando a tipagem a cada mudança no _backend_.
- **Dependências de Escala (Fase 3):** O pacote `@nestjs/schedule` consta na arquitetura estrutural do servidor, porém está associado exclusivamente ao planejamento da Fase 3. Ele atuará na orquestração dos _Cron Jobs_ exigidos para as pílulas de estudo via mensageria (WhatsApp/Telegram).
