---
# Documento: Escopo de Evolução Acadêmica e Produto (Fases 2 e 3)
Área: Planejamento de Escala e Evolução do Produto
Data de geração: 2026-09-16
Status: Rascunho
Fontes utilizadas: Levantamento de Requisitos, Documento 02_Especificação do MVP
---

## 1. Fase 2 (TCC 2) - Telemetria, Retenção e Operação PWA

### Requisitos Funcionais e Não Funcionais

- **RF06 - Dashboard de Estatísticas:** Entrega de painéis gamificados atestando dias seguidos de consistência e carga futura de revisão. _(Status Fundação: Backend já projeta `currentStreak` e `longestStreak` via `submitReview` em `study.service.ts`; interface do dashboard pendente na Fase 2)._
- **RF09 - Modo Chaos:** Botão em interface que executa as views globais agrupadas em rotinas estocásticas em massa. _(Status Fundação: Backend implementado, cálculo de `chaosTz` e `RolloverService.getStudyDayBounds` operacionais no `study.service.ts`; interface e roteamento pendentes na Fase 2)._
- **RF11 - Suporte a Upload e Renderização Multimídia:** Associa URLs seguras providas por object storage dentro do render do flashcard, protegendo payloads e processamentos transacionais.
- **RF12 - Importação de Dados:** Motor de importação .csv contendo bypass curatorial ou fracionamento paginado de blocos (50).
- **RNF07 - Arquitetura PWA e Sincronização Offline:** Acionamento de Service Workers com caches via IndexedDB para permitir a fila desvinculada de banda. A sincronização opera por rota append-only idempotente: cada `ReviewLog` carrega um UUID único gerado no cliente e o backend processa o lote via `createMany` + `skipDuplicates`. O campo `version` (Int, default 1) permanece exclusivamente como controle de ordenação de eventos, sem atuar na resolução de conflitos; não há versionamento no `CardFSRSData`, reflexo derivado dos logs.

### Regras de Negócio e Interface

- **RN09 - Modulação de Cartões Novos:** Suspensão automática de novas aquisições de decks perante a deteção de um estado de fadiga e erro sistemático no período pregresso.
- **RN10 - Dias de Consolidação:** Aferição rígida no calendário suspendendo entregas para promover saneamento de fluxos volumosos em atraso.
- **RN11 - Multiplicador de Consistência (Streak):** Aplica gatilhos comportamentais contrários ao método de Cramming.
- **RN12 - Ancoragem Temporal de Estudo:** Cria mapeamento temporal de acerto diário otimizando bonificações de aderência à janela comportamental ("Janela de Foco").
- **UI06 - Microcopy Afetivo Dinâmico:** Sublinha o progresso adaptando blocos de texto a partir de percentuais base (validação positiva versus humor de limite da sobrecarga).

## 2. Fase 3 (Negócio) - Ecossistema, IA, Portabilidade e Portões Pagos

### Requisitos Funcionais e Não Funcionais

- **RF07 - Integração a APIs de Mensageria:** Envio automatizado via WhatsApp ou Telegram de hiperlinks que compõem pílulas de estudo ativas, utilizando a mesma base agendadora do `@nestjs/schedule` instaurada na Fase 1.
- **RF08 - Módulo de Marketplace:** Criação do ecossistema para intercâmbio/compra de Decks profissionais.
- **RF13 - Geração Automatizada de Conteúdo:** Otimização dos processos de elaboração de cartões usando LLMs em arquivos brutos injetados e transformados na lógica atômica.
- **RF14 - Portabilidade Direcionada de Dados:** Liberação garantida em JSON/CSV de textos nativos das Frentes e Versos para todo arranjo "Autoral". Em composições sob DRM (adquiridas comercialmente no Marketplace), as métricas são exportadas unicamente sem o repasse da PI, validadas pelo tracking assinalado no campo `lastDataExportAt` mapeado na tabela de controle de usuários.
- **RF17 - Meta Dinâmica Baseada em Biometria:** Balanceamento orgânico extraindo pesos estocásticos do IoT biométrico.
- **RNF09 - Proteção DRM e Prevenção de Clonagem:** Defesa arquitetural do código-fonte baseada no relacionamento relacional, sem colunas redundantes de origem. A autoria é determinada por `deck.creatorId`; conteúdos autorais permitem clonagem/exportação quando `deck.creatorId === userId`, enquanto conteúdos comerciais exigem `Enrollment.status = ACTIVE` com origem em `Transaction` vinculada ao usuário. O bloqueio de duplicatas ("Duplicar Deck", "Mover Flashcards") sem licença é centralizado na guarda `checkDeckOwnershipOrLicense` do módulo `DeckService` (NestJS), alinhado ao Documento 05 e ao Levantamento de Requisitos.

### Regras de Negócio

- **RN13 - Rendimentos Decrescentes em Gamificação (Anti-Cramming):** Para vetar a prática nociva de estudo intenso de última hora, impõe-se a aplicação sistemática e indolor de penalização matemática sobre recompensas de gamificação atreladas a cargas que furam o dique orgânico delimitado, caindo o rateio de valoração padrão (ex: de 10 pontuações regulares para 0.1 ponto por cartão extra exaurido).
