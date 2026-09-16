---
# Documento: Especificação do MVP (Fase 1 / TCC 1)
Área: Engenharia de Requisitos e Regras de Negócio
Data de geração: 2026-09-16
Status: Rascunho
Fontes utilizadas: Levantamento de Requisitos, SOP EdTech Guidelines
---

## 1. Requisitos Funcionais do MVP (Núcleo Operacional)

- **Delegação de Identidade (RF01):** Supabase Auth gerencia contas, login e emissão de tokens JWT; NestJS autoriza rotas privadas.
- **Gestão de Decks (RF02):** Criação, edição, exclusão e organização de agrupamentos temáticos de estudo (Decks).
- **Criação de Flashcards (RF03):** Criação de cards com "Frente" e "Verso" atrelados a um Deck.
- **Motor de Sessão de Estudo (RF04):** Apresentação dos cards agendados para o dia atual, ocultando a resposta inicial.
- **Avaliação de Retenção e Telemetria Cognitiva (RF05):** Botões de autoavaliação qualitativa (Errei, Difícil, Bom, Fácil) e captura implícita da latência de resposta em milissegundos para armazenamento no `ReviewLog`.
- **Renderização de Texto Enriquecido e Fórmulas (RF10):** Formatação de texto em Markdown e equações em LaTeX/KaTeX armazenados nativamente como texto leve no banco.
- **Exclusão de Conta e Anonimização de Dados (RF15):** Provê um painel de configurações para garantir o "Direito ao Esquecimento" (Art. 18 LGPD). Acionar a deleção desencadeia um Hard Delete dos PIIs nas tabelas de Perfil e Auth. As métricas do `ReviewLog` não são deletadas, mas reatribuídas a um UUID randômico (RNF08).
- **Gestão de Credenciais e Privacidade (RF16):** Telas dedicadas no Frontend para solicitação de redefinição de senha, atualização de e-mail e painel de privacidade contendo o botão de acionamento irreversível de exclusão de conta.

_(Nota de Arquitetura)_: A query e a validação lógica que misturam cards no "Modo Chaos" (RN05) operam desde a Fase 1. Contudo, a interface final do "Modo Chaos" (RF09) será desenvolvida na Fase 2.

## 2. Requisitos Não Funcionais do MVP

- **Arquitetura de Frontend (RNF01):** Construção da interface via React e TypeScript, empacotada através do Vite.
- **Arquitetura de Backend (RNF02):** Servidor operado em NestJS sobre Node.js garantindo modularidade e tipagem estrita via TypeScript.
- **Persistência de Dados e Integridade (RNF03):** Uso do PostgreSQL com Prisma ORM instanciado de forma limpa, sem propriedades de gerenciamento de estado obsoletas (isento de chaves 'management' inválidas).
- **Performance de Consulta (RNF04):** Aplicação de índices compostos (ex: `@@index([userId, due])` em `CardFSRSData` e `@@index([userId, createdAt])` em `ReviewLog`) no banco de dados e implementação obrigatória de paginação (_lazy loading_).
- **Proteção de Rotas via Guards (RNF05):** AuthGuards globais no NestJS (Passport-JWT) para intercepção e validação criptográfica do Supabase.
- **Storage de Arquivos (RNF06):** Armazenamento de mídia física delegado diretamente aos Buckets do Supabase Storage.
- **Integridade Arquitetural na Anonimização (RNF08):** A exclusão física (Hard Delete) de PIIs e atribuição estatística para UUID randômico é obrigatória. O uso do padrão "Soft Delete" é terminantemente proibido.

## 3. Regras de Negócio do MVP

- **Limites Diários e Priorização de Fila (RN01):** Ordenação estrita da fila de agendamento (1º Atrasados, 2º Hoje, 3º Novos) limitando cargas diárias extremas quantitativamente.
- **Prevenção de Envenenamento de Dados (RN02):** Modal obrigatório "Resetar Progresso de Estudo" perante a alteração de conteúdos que possuem histórico. O reset retorna o cartão para o estado 'New', anulando as métricas de Stability, Difficulty e Retrievability.
- **Isolamento Atômico do Conhecimento (RN03):** Flashcards devem imperativamente transitar pela "Fase de Aprendizado" inicial antes da gradação para intervalos longos.
- **Envio de Notificações (RN04):** O sistema aciona rotinas de agendador (cron jobs) para disparar notificações baseadas na modelagem comportamental de Fogg a usuários com pendências.
- **Sincronização Temporal e Rollover de Sessão (RN06):** Novo dia de estudo é calculado localmente baseado no fuso do cliente, contendo um Offset estabelecido fixamente às 04:00 AM para consolidação natural pelo sono.
- **Leech Protection e Suspensão de Cartões (RN07):** Cartões detentores de falhas consecutivas além do limite (ex: 8) sofrem suspensão automatizada (Hardcoded via `SUSPENDED_STATE = 4` e due date `2099-12-31`).
- **Flag de Fadiga Cognitiva (RN08):** O sistema assinala metadados estocásticos em logs contendo a flag `isFatiguedReview = true` nos eventos que extrapolem 100% da carga orgânica recomendada diária, ignorando estas execuções na otimização por gradiente descendente do modelo estocástico FSRS.

## 4. Requisitos de Interface e Experiência (UX/UI)

- **Estruturação de Layout Flexível e Previsibilidade (UI01):** Posicionamentos definidos arquiteturalmente via Flexbox. A adoção das lógicas em CSS Grid é expressamente proibida no projeto.
- **Componentes de Ancoragem Estática (UI02):** Configuração em modo invariável para cor e estilo de Header e Footer evitando inversões temáticas em temas dark/light.
- **Fluxo de Orientação Mínima (UI03):** Interface de tela cheia sem fragmentações desnecessárias durante a revisão.
- **Navegação Integrada por Teclado (UI04):** Redução da necessidade de interações via mouse mapeando atalhos nativos (Espaço para abrir e 1, 2, 3, 4 para avaliação qualificada).
- **Tela de Curadoria Visual (UI05):** Renderização de bloco de visualização (preview responsivo) antes de inclusões definitivas.
