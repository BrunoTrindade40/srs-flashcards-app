---
# Documento: Especificação do MVP (Fase 1 / TCC 1)
Área: Engenharia de Requisitos e Regras de Negócio
Data de geração: 2026-09-13
Status: Rascunho
Fontes utilizadas: Levantamento de Requisitos, SOP EdTech Guidelines, Revisor de Código Sênior
---

Este documento detalha o Produto Mínimo Viável (MVP), correspondente à Fase 1 do Trabalho de Conclusão de Curso (TCC 1). O escopo está estritamente focado no núcleo operacional e pedagógico da plataforma de retenção cognitiva.

## 1. Requisitos Funcionais do MVP (Núcleo Operacional)

Os requisitos funcionais primários garantem a viabilidade da sessão de estudos, a gestão atômica do conhecimento e a conformidade legal do sistema:

- **Autenticação Delegada (RF01):** A plataforma utiliza o Supabase Auth para gerenciar o ciclo de vida de credenciais e emitir tokens JWT. O _backend_ NestJS não gerencia senhas, atuando unicamente na autorização das rotas privadas mediante validação criptográfica do token (Levantamento de Requisitos, RF01).
- **Gestão de Decks e Flashcards Atômicos (RF02, RF03, RF10):** Estudantes podem criar e organizar _Decks_. A criação de _Flashcards_ exige a fragmentação do conhecimento em "Frente" (Estímulo) e "Verso" (Resposta), suportando nativamente texto enriquecido (Markdown) e fórmulas matemáticas (LaTeX/KaTeX) para garantir um banco de dados relacional leve (Levantamento de Requisitos, RF10).
- **Motor de Sessão de Estudo e Telemetria (RF04, RF05):** O sistema exibe os cartões diários ocultando a resposta para forçar o _Active Recall_. Após revelar o verso, a autoavaliação (rating de 1 a 4) é registrada. O _frontend_ captura de forma invisível a latência de resposta (`reviewDurationMs`), e o _backend_ atua como fonte da verdade, limitando esta latência a um grampo matemático máximo de 60 segundos (`Math.min(ms, 60000)`) para mitigar _outliers_ de inatividade (SOP EdTech Guidelines, Seção 2; Revisor de Código Sênior, Seção 1).
- **Conformidade LGPD via Anonimização (RF15):** A plataforma repudia a exclusão lógica primitiva (_Soft Delete_). O exercício do "Direito ao Esquecimento" dispara uma Anonimização Irreversível: identificadores (PIIs) sofrem _Hard Delete_, e o histórico estatístico de estudo é transferido para um UUID randômico sem chaves estrangeiras ocultas (Levantamento de Requisitos, RNF08).

## 2. Requisitos Não Funcionais

As diretrizes de arquitetura, acessibilidade e performance para o MVP estabelecem tolerância zero a desvios de design e segurança:

- **Interface Estritamente Flexbox (UI01):** Toda a estruturação visual e alinhamentos da aplicação utilizam nativamente o _Flexbox_. O uso de CSS Grid é terminantemente proibido para assegurar a previsibilidade da renderização em diferentes dispositivos (Levantamento de Requisitos, UI01).
- **Acessibilidade e Navegação por Teclado (UI04):** Telas de alto volume cognitivo exigem suporte a atalhos de _hardware_. Teclas como `Espaço`/`Enter` revelam a resposta, e numéricos de `1` a `4` enviam o _rating_. O sistema intercepta o comportamento nativo do navegador (`e.preventDefault()`) para impedir o salto de rolagem (_Scroll Jump_) (Levantamento de Requisitos, UI04; Revisor de Código Sênior, Seção 18).
- **Performance e Segurança:** O NestJS opera com o Prisma ORM e GraphQL protegidos por _Guards_ e `ValidationPipe`. Consultas pesadas adotam o padrão _Zero-Overfetching_, e a memória RAM do _frontend_ é ativamente expurgada (`client.clearStore()`) nos fluxos de _Logout_ (Revisor de Código Sênior, Seção 4 e 17).

## 3. Regras de Negócio do MVP (Implementação Ativa)

As regras matemáticas que governam o motor do FSRS na Fase 1 e sua representação real no _schema_ do Prisma:

- **RN01 - Limites Diários e Priorização de Fila:** O _backend_ constrói a fila de estudos limitando a sobrecarga. A priorização técnica imposta nas _queries_ SQL obedece estritamente à ordem: 1º Atrasados (_Overdue_), 2º Revisão do dia (_Review_), 3º Novos (_New_). Os cartões novos são limitados por um teto diário parametrizável (Levantamento de Requisitos, RN01).
- **RN03 - Isolamento Atômico do Conhecimento:** Um cartão recém-criado ingressa obrigatoriamente na "Fase de Aprendizado". No _schema_, isto é mapeado diretamente no campo `CardFSRSData.state`, garantindo que o algoritmo diferencie o cálculo de intervalos curtos da estabilização de longo prazo (Levantamento de Requisitos, RN03).
- **RN06 - Sincronização Temporal (Rollover):** O algoritmo anula o fuso horário passivo UTC do banco. O _backend_ processa o fechamento diário considerando a consolidação da memória no sono, aplicando um _offset_ de 4 horas, em que o "novo dia" só se inicia às 04:00 AM do fuso local do usuário (Levantamento de Requisitos, RN06).
- **RN08 - Flag de Fadiga Cognitiva:** Se o estudante ultrapassar 100% da carga diária estipulada, o log salva a interação com o campo `ReviewLog.isFatiguedReview = true`. Esta _flag_ atua como um escudo, ordenando ao motor que isole essas falhas e não envenene o gradiente de otimização do algoritmo (Levantamento de Requisitos, RN08).

## 4. Fluxos de Interface do Núcleo

O mapeamento das rotas operacionais garantidas no MVP, encapsuladas em _Dumb Components_ isolados:

1. **Login:** Formulário não-controlado integrado ao `Supabase Auth`, implementando _Rate Limiting_ no backend e operando com purga de sessões antigas na RAM.
2. **Criação de Deck:** Modal focado no "Padrão Bouncer" com validação _Code-First_. Rejeita criações vazias localmente e atualiza a UI otimisticamente (`Optimistic UI`) em custo O(1) através do `cache.modify`.
3. **Criação de Flashcard:** Suporta curadoria visual em tempo real (Preview do _Abstract Syntax Tree_ do Markdown) sem bloquear a _thread_ principal.
4. **Sessão de Estudo & Avaliação:** O orquestrador central. Apresenta o cartão, monitora a latência em modo furtivo (`useRef`) e envia os _ratings_ (1 a 4). Resoluções executam transição de estado síncrona entre cartões, sem telas de carregamento intermediárias.

## 5. Fora do Escopo (Fases 2 e 3)

Embora a fundação arquitetural e o _schema_ do banco de dados (Prisma) já estejam estruturados para comportar o escalonamento do produto, os seguintes recursos estão **categoricamente excluídos** do esforço de desenvolvimento e estabilização do MVP (Fase 1). Estes itens serão tratados e desenvolvidos nas Fases 2 e 3:

- **RN05 (Modo Chaos - Interleaving Global):** A modalidade é registrada sob o campo `StudySession.studyMode` (campo String estrito com valores controlados — decisão deliberada do projeto, convertido de Enum nativo do Prisma para String). O _backend_ já possui fundação de Modo Chaos implementada (incluindo o cálculo de `chaosTz` e a invocação de `RolloverService.getStudyDayBounds(chaosTz)` no `study.service.ts`). A exclusão do MVP refere-se estritamente à construção da interface visual e ao roteamento no frontend (Levantamento de Requisitos, RF09).
- **RN09 (Modulação de Cartões Novos / Prevenção de Sobrecarga):** A suspensão sistêmica do deck diário baseada em índices de exaustão do dia anterior será automatizada apenas na Fase 2 (Levantamento de Requisitos, RN09).
- **RN13 (Anti-Cramming / Rendimentos Decrescentes):** A penalidade gamificada em pontos para o estudo excessivo de véspera é uma regra de escala comercial mapeada para a Fase 3 (Levantamento de Requisitos, RN13).
- **Módulos Visuais e Estruturais Futuros:** _Dashboard_ de Estatísticas e _Streaks_ (RF06), Empacotamento _Progressive Web App_ para funcionamento _Offline_ via IndexedDB (RNF07), Upload de Mídias/Imagens via Object Storage (RF11), Integrações IoT para carga guiada por biometria (RF17), Geração de conteúdo por IAs/LLMs (RF13) e Módulo de Pagamentos/Marketplace (RF08).

---

## PRÓXIMOS PASSOS

- **Pendência:** Revisão final do autor.
