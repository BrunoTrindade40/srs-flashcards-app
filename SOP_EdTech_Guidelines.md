# SOP: Diretrizes de Engenharia Pedagógica e Arquitetura EdTech

## 1. Engenharia Pedagógica e Motor de Aprendizado (O Núcleo)

- **Aplicação de Active Recall:** Projete interações que exijam esforço cognitivo do usuário para recuperar a informação da memória antes de apresentar a resposta (ex: flashcards, quizzes ocultos)[cite: 24].
- **Spaced Repetition Systems (SRS):** Implemente algoritmos de repetição espaçada (como FSRS ou SM-2) para agendar revisões intradiárias (Fase de Aprendizado) e espaçadas (Dias/Meses), otimizando a curva de esquecimento[cite: 24].
- **Prevenção de Sobrecarga:** Limite a introdução de novos conceitos[cite: 24]. A tecnologia deve servir à aprendizagem; evite mecânicas que causem fadiga cognitiva[cite: 24].
- **Prevenção de Envenenamento de Dataset (RN02):** Bloqueie edições silenciosas de flashcards que já possuam histórico. Exija confirmação via interface: se a edição for estrutural, o backend deve destruir e resetar as métricas estocásticas (Stability/Difficulty) para não corromper o modelo FSRS.

## 2. Arquitetura de Software e Fluxo de Dados (A Sustentação)

- **Centralização Matemática (Dumb Terminal SSOT):** O Frontend não calcula intervalos de revisão, tetos diários ou pontuações. O Backend (NestJS/Prisma) é a Única Fonte da Verdade. O Frontend apenas lê a fila e despacha eventos.
- **Telemetria Defensiva:** O frontend deve medir a latência de resposta de forma invisível via `performance.now()`. O backend jamais deve confiar cegamente nesse dado, aplicando grampos matemáticos (ex: `Math.min(ms, 60000)`) para ignorar anomalias (ex: usuário abandonou a aba aberta).
- **Isolamento Crítico (Error Boundaries):** Motores de leitura pesados (Markdown, LaTeX) devem ser estritamente encapsulados. Uma fórmula mal formatada não pode derrubar a árvore do React inteira.

## 3. UX Cognitiva e Interface (A Interação)

- **Minimização da Carga Cognitiva:** Mantenha áreas de ancoragem visual (cabeçalhos e rodapés) limpas[cite: 24]. Remova distrações periféricas na interface de estudo[cite: 24].
- **Latência Zero (Optimistic UI):** Rotinas de alto volume cognitivo (avaliar flashcards) PROÍBEM telas de carregamento (`loading`). Utilize Mutações Otimistas no Apollo Client para avançar a fila instantaneamente (0ms), mantendo o "Cognitive Flow".
- **Acessibilidade Universal:** Garanta alto contraste, navegação operável inteiramente por teclado e suporte a leitores de tela[cite: 24]. É obrigatório invocar `e.preventDefault()` nos atalhos de teclado (Espaço/Enter) para impedir pulos de rolagem (Scroll Jump) que quebrem o foco visual.

## 4. Segurança, Compliance e Validação (As Regras Inegociáveis)

- **Validação Incremental:** Construa hipóteses, desenhe o MVP mais enxuto possível, teste com alunos reais e itere[cite: 24].
- **Métricas Quantitativas:** Rastreie taxa de acerto, tempo de latência na resposta (milissegundos) e consistência diária (streaks)[cite: 24].
- **Métricas Qualitativas:** Avalie o nível de dificuldade percebida (rating de 1 a 4) reportada pelo usuário após o esforço de memória[cite: 24].
- **Anonimização Irreversível:** O "Direito ao Esquecimento" exige Hard Delete de dados sensíveis. Combine essa exclusão no backend com a invocação de `client.clearStore()` no frontend durante o logout, purgando a RAM contra vazamentos cruzados. "Soft Delete" é expressamente proibido.

## 5. Detecção e Correção de Anti-patterns (O Bloqueio)

- **Gamificação Vazia (Bloquear):** Rejeite a adição de pontos, badges e rankings (PBL) que não reforcem diretamente o objetivo pedagógico ou o hábito de estudo[cite: 24]. O sistema deve recompensar a consistência, não o estudo massivo de véspera (Cramming).
- **Silos de Conhecimento no Código (Bloquear):** Impeça que regras de validação (ex: limites de caracteres) existam apenas no componente React. Exija validação Code-First centralizada (Diretório de domínio + DTOs).
- **Tecnologia pela Tecnologia (Bloquear):** Impeça a implementação de features complexas (ex: IA generativa, animações pesadas) se não houver um problema educacional claro a ser resolvido pelo MVP[cite: 24].
- **Soluções Genéricas (Bloquear):** Recuse propostas que ignorem as limitações técnicas da stack, orçamento de computação (nuvem) ou prazo de entrega[cite: 24].
