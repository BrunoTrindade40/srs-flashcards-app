---
# Documento: Modelagem de Dados e Integrações (Prisma & PostgreSQL)
Área: Engenharia de Dados e Integrações de Sistema
Data de geração: 2026-09-14
Status: Revisado
Fontes utilizadas: Levantamento de Requisitos, SOP EdTech Guidelines, Documento 04_Arquitetura de Software e Estrutura de Repositório
---

Este documento delineia a infraestrutura do banco de dados, estabelecendo as diretrizes estruturais para o mapeamento relacional via Prisma ORM e PostgreSQL. O modelo atende aos rigores estatísticos do algoritmo FSRS, às normativas de privacidade da LGPD e à escalabilidade de requisições de telemetria.

## 1. Diretrizes Globais de Persistência

- **Engine de Banco de Dados:** O sistema utiliza o PostgreSQL modelado estritamente através do Prisma ORM.
- **Segurança de Conexão (RNF03):** O Prisma Client será instanciado sem a passagem de propriedades de gerenciamento de estado obsoletas (ex: parâmetros `management` descontinuados), mitigando falhas silenciosas de rede e garantindo alocação limpa no connection pool.

## 2. Entidades de Domínio e Conformidade Legal (LGPD)

O ciclo de vida do estudante possui rastreabilidade financeira e auditoria jurídica amparada no modelo de dados.

- **User (Estudante):** Armazena os dados primários de acesso (id em formato UUID, authId do Supabase, name, email).
- **Controle de Portabilidade (RF14):** A entidade conta com o campo `lastDataExportAt`. Este controle registra o timestamp da última exportação de dados (CSV/JSON), regendo limites de taxa (rate limits) e auditoria para a funcionalidade do Direito à Portabilidade Direcionada de Dados.
- **Anonimização Irreversível (RNF08 / RF15):** Em observância ao Direito ao Esquecimento da LGPD, a coluna `isAnonymized` (padrão `false`) atua como flag de conformidade. O acionamento da exclusão de conta provoca o Hard Delete físico dos Identificadores Pessoais (PIIs) nas tabelas locais e no provedor Supabase Auth. Simultaneamente, o backend reatribui todas as tabelas estatísticas (`ReviewLog`, `CardFSRSData`) a um UUID randômico, preservando a inteligência dos parâmetros do modelo estocástico FSRS. Práticas de "Soft Delete" são sumariamente proibidas.
  - _Nota de Implementação (RNF08):_ Para garantir a integridade referencial nas tabelas `ReviewLog` e `CardFSRSData` sem violar a LGPD, o backend criará um registro "fantasma" na tabela `User` com o novo UUID randômico gerado e seus campos de Identificação Pessoal anulados (`name` = null, `email` = 'anon-' + uuid + '@invalid', `isAnonymized` = true). Outra alternativa é isolar e migrar a telemetria para um datastore analítico desvinculado antes da deleção.

## 3. Gestão de Conteúdo e Proteção de Negócios

A divisão de ecossistemas (Autoral vs. Comercial) sustenta o Marketplace (RF08) por intermédio das chaves transacionais.

- **Deck e Flashcard:** O armazenamento atômico mantém "Frentes" e "Versos" no modelo serializado de texto para preservação das anotações em Markdown e equações LaTeX (RF10).
- **Transações e Matrículas (Transaction / Enrollment):** O mapeamento separa a autoria do acesso. O usuário que adquire um baralho de terceiros consome os dados via entidade `Enrollment` atrelada à integridade financeira de uma `Transaction` (RF08).
- **Proteção DRM e Prevenção de Clonagem (RNF09):** A validação de propriedade intelectual e direitos de acesso dispensa o uso de colunas redundantes, derivando a lógica nativamente do relacionamento relacional. A autoria original é determinada de forma estrita pela chave `creatorId` da entidade `Deck`. Conteúdos são considerados autorais (clonagem e exportação integral permitidas) quando `deck.creatorId === userId`. Conteúdos comerciais são identificados pela existência de um `Enrollment` com origem em uma `Transaction` vinculada ao usuário.
  - _Regra de Licenciamento:_ O acesso a recursos comerciais exige estritamente que a propriedade `Enrollment.status` esteja registrada como `ACTIVE` (além da chancela de faturamento `Transaction` garantida sem estornos). O bloqueio em lote de requisições de clonagem pirata (ex: "Mover Flashcards" ou "Duplicar Deck") é orquestrado pelo método de guarda `checkDeckOwnershipOrLicense` encapsulado no `DeckService` do NestJS.

## 4. Núcleo Algorítmico FSRS e Telemetria Cognitiva

As tabelas associadas ao avanço cognitivo suportam picos de requisição diários sem degradar o backend.

- **CardFSRSData (Estado de Memória):** Entidade associada em 1:1 por par (Flashcard, User), isolando os coeficientes estocásticos do motor (Stability, Difficulty, Lapses).
  - **Performance Diária (RNF04):** O agendamento das revisões será escalado por um índice composto `@@index([userId, due])`, viabilizando os filtros ordenados no Motor de Sessão de Estudo em tempo logarítmico O(log n). A indexação apenas em B-Tree sobre o campo `due` é insuficiente.
  - **Leech Protection (RN07):** Para resguardar a fadiga do usuário, flashcards que ultrapassem o limiar de falhas sucessivas recebem a atualização definindo o status como `SUSPENDED_STATE = 4` e a data de agendamento (`due`) para `2099-12-31`.
  - _Arquitetura de Interceptação:_ O bloqueio será implementado no `study.service.ts`, que operará na interceptação deste estado ANTES da invocação do pacote estocástico. A biblioteca externa `ts-fsrs` do motor FSRS-6 mapeia internamente os estados cognitivos 0 a 3, inviabilizando processamentos do `state = 4`, que corromperiam o pipeline do algoritmo.
- **ReviewLog (Dataset de Otimização):** Tabela de natureza append-only que registra a auditoria cognitiva por inserção de autoavaliação (RF05).
  - **Otimização Analítica (RNF04):** Para a consolidação rápida de gráficos no Dashboard (RF06), os resumos desta tabela adotam o índice composto `@@index([userId, createdAt])`.
  - **Sincronização PWA Offline (RNF07):** Para o descarregamento assíncrono perante a intermitência de rede local do usuário, a resolução de concorrência dos registros do PWA operará adotando a estratégia de **idempotência via UUID gerado no cliente**. O backend processará os envios em lote através do método `createMany` acompanhado da diretiva `skipDuplicates`. O campo `version` (Int) será mantido exclusivamente como um controle secundário de ordenação de eventos no tempo, sem atuar na resolução arbitrária de conflitos destrutivos (_Last-Write-Wins_), garantindo que a natureza estrita de _append-only_ da tabela de logs não sofra mutações corruptivas. A entidade `CardFSRSData` não detém versionamento próprio, sendo um reflexo das execuções enfileiradas derivadas dos logs.

## 5. Extensões de Telemetria Fisiológica e Ecossistema (Fase 3)

- **BiometricLog (Integração IoT - RF17):** A entidade vincula as batidas cardiológicas (BPM) e sinais fisiológicos (coletados de hardwares Apple HealthKit/Google Fit) aos intervalos exatos de `sessionId` gerados na transição de estudos da entidade `StudySession`. Este repositório provê o alicerce matemático para recálculos adaptativos de limites diários baseados no estado fisiológico de prontidão ou fadiga do estudante.
- **Renderização e Acessibilidade:** Em estrita adesão aos requisitos estruturais e de interface (UI01), a exibição de painéis, Dashboards de métricas e vitrines do Marketplace deverá ser implementada invariavelmente através de Flexbox no Frontend. Arquiteturas que façam uso de CSS Grid estão banidas visando preservar a consistência visual em todas as densidades de tela.

---

## PRÓXIMOS PASSOS

- **Pendência:** Na funcionalidade de exportação de dados com trava DRM (RF14), assegurar que, para Decks comerciais, o relatório agregado elimine inteiramente o conteúdo literário (frente/verso do flashcard), restringindo-se puramente às métricas de ReviewLog do estudante.
- **Pendência:** Centralizar a criação da guarda lógica de verificação de DRM (`checkDeckOwnershipOrLicense`) no módulo `DeckService` do NestJS.
- **Pendência:** Refinar as tipagens de DTO para os serviços de exportação agregada de métricas estipuladas no RF14.
