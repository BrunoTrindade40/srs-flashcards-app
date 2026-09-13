---
# Documento: Escopo de Evolução Acadêmica e Produto (Fases 2 e 3)
Área: Planejamento de Escala e Evolução do Produto
Data de geração: 2026-09-13
Status: Rascunho
Fontes utilizadas: Levantamento de Requisitos, Arquitetura do Repositório, Modelo Entidade-Relacionamento
---

Este documento estabelece o escopo das Fases 2 (TCC 2) e 3 (Escala de Negócio), detalhando funcionalidades futuras e avaliando o nível de fundação técnica atual no _backend_ e _schema_ da aplicação.

## 1. Fase 2 / TCC 2: Gamificação, Retenção e Offline

A segunda fase tem foco na usabilidade avançada, retenção diária e flexibilidade de estudo do usuário.

- **Dashboard de Estatísticas e Streaks (RF06):**
  - _Objetivo:_ Exibir taxa de acerto, carga de revisão futura e dias seguidos de estudo (Levantamento de Requisitos, RF06).
  - _Nível de Fundação (Backend em uso / UI pendente):_ O _backend_ já projeta as métricas `currentStreak` e `longestStreak` no select de atualização do usuário dentro da lógica de `submitReview` no `study.service.ts`, participando do fluxo de revisão. A UI gráfica do dashboard e as _queries_ específicas de totalização precisam ser implementadas no frontend.
- **Modo Chaos (RF09):**
  - _Objetivo:_ Misturar baralhos atrasados em uma única sessão global, forçando a intercalação cognitiva (Interleaving) para solidificar a memória (Levantamento de Requisitos, RN05).
  - _Nível de Fundação (Backend Implementado / Frontend Pendente):_ O _backend_ já possui a fundação funcional estabelecida: o arquivo `study.service.ts` calcula o `chaosTz` e chama `RolloverService.getStudyDayBounds(chaosTz)`. A modalidade é registrada no campo `StudySession.studyMode` (campo String estrito com valores controlados — decisão deliberada do projeto, convertido de Enum nativo do Prisma para String). A fase 2 exigirá apenas o roteamento e a construção da interface.
- **Suporte a Upload e Multimídia (RF11):**
  - _Objetivo:_ Anexar imagens e áudios à Frente ou Verso do _flashcard_ (Levantamento de Requisitos, RF11).
  - _Nível de Fundação (Modelado):_ O _schema_ do Prisma e o Modelo ER comportam os atributos `imageUrl` e `audioUrl` para a entidade. Resta a integração com o Object Storage do Supabase e a validação MIME.
- **Importação de Dados CSV (RF12):**
  - _Objetivo:_ Geração em lote de _flashcards_ via _upload_ de arquivo externo (Levantamento de Requisitos, RF12).
  - _Nível de Fundação (Pendente):_ Requer criação da rotina de processamento assíncrona e interface de curadoria visual no _frontend_.
- **Arquitetura PWA e Sincronização Offline (RNF07):**
  - _Objetivo:_ Permitir acesso à fila de revisões sem internet através de IndexedDB e _Service Workers_ (Levantamento de Requisitos, RNF07).
  - _Nível de Fundação (Parcialmente Modelado):_ O controle de concorrência para sincronização offline é fundamentado no campo `version` (Int, default 1) da entidade `ReviewLog` (Modelo Entidade-Relacionamento). `CardFSRSData` não utiliza versionamento, pois seu estado é derivado das operações registradas no log de revisões. Isso viabilizará a futura resolução otimista de sincronismo de logs de estudo ao reconectar.

## 2. Fase 3 / Negócio: Ecossistema, IA e Integrações

Esta fase direciona o projeto à escala de comercialização e autonomia pedagógica via infraestrutura avançada.

- **Módulo de Marketplace e DRM (RF08):**
  - _Objetivo:_ Permitir publicação, compra e transferência de licenças de Decks entre os usuários (Levantamento de Requisitos, RF08).
  - _Nível de Fundação (Parcialmente Modelado):_ O atributo `isPublished` já está inserido no modelo do Baralho (`Deck`) conforme verificado nas migrações do banco de dados, mapeando itens públicos para a vitrine. Falta integrar pagamentos (Stripe/Pix) e a política de Direitos Digitais (DRM).
- **Geração Automatizada de Conteúdo via IA / LLMs (RF13):**
  - _Objetivo:_ Integração com APIs como OpenAI/Gemini para extrair conceitos-chave de arquivos `.pdf` ou texto livre (Levantamento de Requisitos, RF13).
  - _Nível de Fundação (Parcialmente Modelado):_ O Modelo Entidade-Relacionamento mapeia rigorosamente a origem da IA via atributo `aiModelSource` na tabela `Flashcard` e exige auditoria flaggada no atributo `isEditedAfterAi`. Requer a construção da infraestrutura de _prompts_ no NestJS.
- **Metas Dinâmicas Baseadas em Biometria IoT (RF17):**
  - _Objetivo:_ Ajuste algorítmico da carga de _cards_ embasado na variabilidade cardíaca e horas de sono extraídas de smartwatches (Levantamento de Requisitos, RF17).
  - _Nível de Fundação (Apenas Modelado Conceitualmente):_ Previsto estruturalmente via entidade de logs biométricos na base de dados (`BiometricLog`) para modulação futura (Modelo Entidade-Relacionamento).
- **Integração a APIs de Mensageria (RF07):**
  - _Objetivo:_ Disparo automatizado de "pílulas de estudo" e atalhos de retenção via WhatsApp ou Telegram (Levantamento de Requisitos, RF07).
  - _Nível de Fundação (Planejado na Stack):_ A infraestrutura do NestJS já possui a dependência `@nestjs/schedule` provisionada no `package.json`, que será responsável por orquestrar os _Cron Jobs_ de envio assíncrono.

---

## PRÓXIMOS PASSOS

- **Pendência:** Revisão final do autor.
