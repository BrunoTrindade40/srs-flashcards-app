---
# Documento: Fundamentação Científica e Cognitiva
Área: Base Teórica e Engenharia Pedagógica
Data de geração: 2026-09-13
Status: Rascunho
Fontes utilizadas: Levantamento de Requisitos, SOP EdTech Guidelines, Revisor de Código Sênior, Registros de Commit, package.json
---

Este documento fundamenta o referencial teórico e arquitetural do Trabalho de Conclusão de Curso em Sistemas de Informação, detalhando as diretrizes cognitivas que regem a plataforma.

## 1. Fundamentação Teórica do Aprendizado

A arquitetura pedagógica do sistema opera sob quatro pilares validados das ciências cognitivas, desenhados para atuar como um motor de retenção eficiente a longo prazo:

- **A Curva do Esquecimento (Ebbinghaus):** O cérebro humano descarta ativamente informações não recuperadas (SOP EdTech Guidelines, Seção 1). O sistema funciona como um "marcapasso" da memória, agendando revisões precisas antes que a taxa de retenção atinja níveis críticos (SOP EdTech Guidelines, Seção 1).
- **Active Recall (Prática de Recuperação):** A consolidação neural exige o esforço cognitivo de extrair a informação da memória, em oposição à reexposição passiva, como a leitura (SOP EdTech Guidelines, Seção 1). O sistema força esta prática ocultando o verso do _flashcard_ e condicionando o avanço à autoavaliação do estudante (Levantamento de Requisitos, RF04).
- **Spaced Repetition Systems - SRS (Repetição Espaçada):** A distribuição dos testes no tempo é a mecânica primária de otimização (SOP EdTech Guidelines, Seção 1). Intervalos intradiários formam a "Fase de Aprendizado", enquanto intervalos de dias ou meses atuam na retenção profunda, orquestrados pela biblioteca _ts-fsrs_ (versão ^5.4.1) (Levantamento de Requisitos, RN03).
- **Interleaving e Dificuldades Desejáveis:** A introdução de atritos controlados no fluxo de estudo fortalece a resiliência da memória (Registros de Commit). O "Modo Chaos" reflete essa teoria ao ignorar o isolamento por baralhos, forçando a intercalação determinística de múltiplos assuntos na mesma sessão (Levantamento de Requisitos, RN05).

## 2. Motor Algorítmico: FSRS (Implementação via ts-fsrs ^5.4.1)

O agendamento do sistema adota o Free Spaced Repetition Scheduler (FSRS-6), implementado de ponta a ponta através da biblioteca _ts-fsrs_ (versão ^5.4.1) instalada no ambiente do backend.

Diferente de sistemas legados baseados em matrizes estáticas (como o SM-2), **o FSRS não é uma rede neural**. Trata-se de um modelo estocástico baseado no modelo de memória DSR (Difficulty, Stability, Retrievability), com parâmetros otimizados por gradiente descendente a partir dos logs de revisão do usuário (Revisor de Código Sênior, Seção 15).

A parametrização do motor no módulo NestJS (especificamente no arquivo `study.service.ts`) inicializa instâncias padrão via `new FSRS({})` utilizando os pesos originais da biblioteca para o MVP. Caso o usuário possua pesos customizados calibrados e persistidos no banco de dados, o serviço orquestra a injeção condicional via `new FSRS({ w: user.fsrsWeights })`.

O motor _ts-fsrs_ (^5.4.1) processa o agendamento através das seguintes variáveis contínuas, persistidas na tabela `CardFSRSData`:

- **Stability (Estabilidade - S):** O tempo (em dias) para a retrievabilidade decair de 100% para 90% (SOP EdTech Guidelines, Seção 1).
- **Difficulty (Dificuldade - D):** A complexidade intrínseca do _flashcard_, oscilando dinamicamente a cada resposta processada pelo _ts-fsrs_ (^5.4.1).
- **Retrievability (Recuperabilidade - R):** A probabilidade temporal de o usuário lembrar o conceito no exato momento da revisão (SOP EdTech Guidelines, Seção 1).

## 3. Design Comportamental e Mitigação de Sobrecarga

Para prevenir o "Efeito Bola de Neve" (acúmulo exponencial de revisões e consequente abandono da plataforma), o sistema aplica as seguintes regras de negócio defensivas em conjunto com o motor _ts-fsrs_ (^5.4.1):

- **Priorização Matemática (Capping Diário):** O motor de fila prioriza estritamente os cartões atrasados (Overdue) sobre as revisões do dia, bloqueando sistemicamente a injeção de conceitos novos (New) se o teto de carga cognitiva for violado (Levantamento de Requisitos, RN01).
- **Modulação contra Fadiga (Fase 2):** O limite de introdução de novos conceitos é suspenso se o tempo de sessão do dia anterior configurar exaustão (Levantamento de Requisitos, RN09). Respostas emitidas sob exaustão recebem a flag `isFatiguedReview = true`, instruindo o _ts-fsrs_ (^5.4.1) a ignorar falhas para não envenenar as otimizações por gradiente descendente (Levantamento de Requisitos, RN08).
- **Ancoragem Temporal (Rollover):** O agendamento cognitivo não ocorre à meia-noite (UTC), mas aplica um fator de _offset_ ajustado para as 04:00 AM (horário local do usuário), garantindo a consolidação da memória pelo sono (Levantamento de Requisitos, RN06).
- **Rendimentos Decrescentes (Anti-Cramming - Fase 3):** O estudo intensivo de véspera é combatido zerando quase que totalmente a pontuação atribuída a cartões revisados acima do limite diário saudável, gamificando a consistência em vez do volume (Levantamento de Requisitos, RN13).

## 4. Histórico de Decisões e Linha do Tempo Arquitetural

As decisões técnicas e de produto abaixo foram adotadas no ciclo de desenvolvimento, com suas respectivas justificativas e ideias descartadas:

- **Adoção Exclusiva de Flexbox em Detrimento de CSS Grid**
  - _Decisão e Justificativa:_ Estabeleceu-se o uso rigoroso e exclusivo de Flexbox para todo o layout, garantindo alinhamento absoluto e prevenindo a imprevisibilidade de renderização no motor visual do _frontend_ durante interações rápidas.
  - _Ideia Descartada:_ Qualquer uso de CSS Grid foi sumariamente vetado da arquitetura da aplicação.
- **Conformidade LGPD via Anonimização Irreversível**
  - _Decisão e Justificativa:_ Para cumprir estritamente com o "Direito ao Esquecimento" exigido por legislações de proteção de dados, adotou-se o fluxo de Anonimização Irreversível. Os dados sensíveis sofrem exclusão física (Hard Delete), enquanto a telemetria do _ts-fsrs_ (^5.4.1) é desvinculada para um UUID randômico, preservando a integridade do modelo estatístico (Revisor de Código Sênior, Seção 41).
  - _Ideia Descartada:_ O padrão tradicional de _Soft Delete_ (apenas ocultar registros ativos com uma _flag_) foi rejeitado por reter indevidamente metadados identificáveis.
- **Delegação de Identidade e Tenant Isolation**
  - _Decisão e Justificativa:_ O gerenciamento de credenciais e a emissão de JWTs ocorrem via Supabase Auth. O NestJS restringe-se à autorização de rotas (Levantamento de Requisitos, RF01). No _Logout_, a memória RAM é expurgada de forma síncrona via `client.clearStore()` (Revisor de Código Sênior, Seção 1).
  - _Ideia Descartada:_ Autenticação monolítica própria.
- **Otimização de Cache (Zero-Overfetching)**
  - _Decisão e Justificativa:_ Derivação de contadores e agregadores estáticos diretamente do `.length` da coleção na memória RAM do cliente, utilizando a interceptação via `TypePolicy` do Apollo Client (Revisor de Código Sênior, Seção 21).
  - _Ideia Descartada:_ Dependência de campos `_count` do banco nas requisições GraphQL após operações de deleção.
- **Telemetria Defensiva (Grampo de Tempo de 60s)**
  - _Decisão e Justificativa:_ O _frontend_ afere o tempo de latência (`reviewDurationMs`) da resposta, mas o _backend_ atua como fonte da verdade, aplicando um grampo matemático máximo de 60 segundos (`Math.min(ms, 60000)`) (Revisor de Código Sênior, Seção 1).
  - _Ideia Descartada:_ Confiar estritamente no tempo aferido pela interface, o que poderia inserir _outliers_ graves nos logs se a aba do navegador fosse abandonada aberta.

---

## PRÓXIMOS PASSOS

- **Pendência:** Revisão final do autor.
