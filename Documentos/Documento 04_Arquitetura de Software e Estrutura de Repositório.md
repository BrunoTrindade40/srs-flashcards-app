---
# Documento: Arquitetura de Software e Estrutura de Repositório
Área: Engenharia de Software e Padrões de Código
Data de geração: 2026-09-16
Status: Rascunho
Fontes utilizadas: package.json, Registros de Commit, Revisor de Código Sênior
---

## 1. Stack Tecnológica e Ferramental

- **Backend:** TypeScript estrito alocado sobre a plataforma Node.js implementado arquiteturalmente pelo framework NestJS. O uso do Prisma como ORM atua restritamente em Postgres configurando banco transacional não exposto, vetadas configurações management obsoletas.
- **Frontend:** Estilização de apresentação com flexibilização de layout estruturado no padrão Flexbox, declarando interdição total ao modelo CSS Grid. Bibliotecas UI integradas sobre a raiz React/Vite.
- **BaaS Auxiliar:** Supabase garantindo segurança escalável de acessos unicamente via Auth Server e gestão BLOB via Storage.

## 2. Estrutura de Diretórios e Domínios

Isolamento absoluto delimitando domínios limpos em frontend e backend.

### Topologia Frontend (`web-srs-frontend/src/`)

Estrutura fragmentada para desacoplamento cognitivo, baseada no repositório padrão:

- `pages/`: Arquitetura superior de visões de negócio agregadas na malha roteada principal.
- `components/`: Bibliotecas de reuso UI restritas, atômicas e isoladas funcionalmente.
- `hooks/`: Contratos customizados portando as abstrações do React.
- `context/`: Fornecedores globais para transações essenciais assíncronas em níveis não propáveis (ex: Toast, Auth).
- `domain/`: Estruturas analíticas limpas (Lógicas puras blindadas do React).
- `lib/`: Envolvimentos utilitários e clientes pré-configurados de instâncias third-party.
- `gql/`: Espelhamento auto-transpilado de conexões de contrato com GraphQL local.
- `routes/`: Disposição paramétrica das rotinas do React Router.

### Topologia Backend (`api-srs-backend/src/`)

Implementa o paradigma encapsulador do NestJS fragmentado em subdomínios (tríade Module/Service/Resolver):

- `auth/`: Configura as chancelas inter-rotas de Guards JWT para interceptar metadados sem acionar lógicas impuras.
- `common/`: Estruturas de manipulações agnósticas (Filtros globais, Constantes, DTOs compartilhados).
- `deck/`: Tratamento semântico voltado à organização macro e dependências de entidades-filhas.
- `flashcard/`: Gestão conteudista crua da aplicação atômica de frente-verso.
- `study/`: Bloco central das rotinas de repetição (ex: Leech Protection imposto sobre instâncias fixadas em `SUSPENDED_STATE = 4`).
- `user/`: Limitações sistêmicas do proprietário atuando massivamente como gerenciador base perante manipulações regidas pela LGPD.

## 3. Diretrizes de Codificação e Isolamento Arquitetural

- **Segregação de Tipagem Restrita (.types.ts / .tsx):** É estabelecida no repositório a padronização estrita de separação modular dos dados. Definições estruturais puras não poderão acoplar-se nos módulos JSX. Tipagens atômicas residirão enclausuradas em extensões `.types.ts`. Extensões descritas em `.tsx` atuam imutavelmente restritas em componentes focais, preservando sem degradações a infraestrutura otimizada do módulo de Fast Refresh provida pelo framework Vite.
- **Acessibilidade Universal (a11y):** Imposta a configuração assistiva sistêmica utilizando `aria-live="polite"` orquestrada unicamente na instância controladora do `ToastProvider` lidando com o fluxo reativo sem perturbar Leitores de Tela. O bloqueio em fluxo estrito é imposto aos overlays (Focus Trap) limitando e vedando acessos falsos às interações sobrepostas por Modais.
- **Serialização Estocástica e Performance Transacional:** Para contornar a imprevisibilidade de atualizações no modelo estocástico FSRS (otimização por gradiente descendente), os metadados contendo os pesos vetoriais (`fsrsWeights`) operam gravados em instâncias estáticas formato JSONB direto no PostgreSQL.
- **Coordenação Lógica Integrada (@nestjs/schedule):** O pacote utilitário de rotinas programadas integra vitalmente a fundação do Produto Fase 1 para sustentar varreduras (RN04) visando identificar falhas temporais orgânicas do estudante (Base de Fogg) reaproveitando sua estrutura em escopo horizontal na comercialização de envios comunicativos Phase 3 (RF07).
