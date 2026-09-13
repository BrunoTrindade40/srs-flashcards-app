# Base de Conhecimento Técnico: Revisão de Código Sênior

## 1. Escopo e Arquitetura Global (MVP - Fase 1) 🏗️

- **Stack Tecnológica e Foco no MVP (YAGNI):**
  - 🔴 **PROIBIDO:** Implementar e travar o fluxo com funcionalidades fora do escopo primário (ex: áudio, IA, biometria).
  - 🟢 **OBRIGATÓRIO:** Utilizar estritamente Frontend (React 19, Vite, TypeScript, Apollo Client v4.2.7, TailwindCSS v4) e Backend (NestJS, Prisma ORM, GraphQL, TypeScript, Supabase Auth). Funcionalidades futuras devem ser tratadas como opcionais (`nullable`) no GraphQL.
- **O Padrão "Terminal Burro" (SSOT):**
  - 🔴 **PROIBIDO:** O Frontend calcular regras de negócio, limites diários ou filas de estudo.
  - 🟢 **OBRIGATÓRIO:** O NestJS/Prisma é a Única Fonte da Verdade. O React exibe dados e despacha eventos em complexidade O(1) (sempre lendo o topo da fila, index 0).
- **Defesa na Fronteira e Temporal:**
  - 🔴 **PROIBIDO:** O Backend confiar na telemetria do Frontend para o tempo gasto em respostas. Injetar IDs de usuários abertos via payload (Risco de IDOR).
  - 🟢 **OBRIGATÓRIO:** O Backend deve aplicar grampos matemáticos (`Math.max(0, Math.min(ms, 60000))`) em logs de tempo. O Frontend aplica filtro secundário em milissegundos (`useMemo` no campo `due`) contra discrepâncias de timezone. Identidades de usuário são extraídas exclusivamente do JWT no Backend.
- **Purga de Memória (Tenant Isolation):**
  - 🔴 **PROIBIDO:** Processos de Logout que limpam a autenticação do Supabase mas mantêm o cache de dados sensíveis na árvore visual ou na memória RAM.
  - 🟢 **OBRIGATÓRIO:** O fluxo de Logout exige a purga da memória RAM do navegador de forma síncrona executando `client.clearStore()` junto com a desconexão do Supabase.

## 2. TypeScript Defensivo e Clean Code 🛡️

- **Tolerância Zero a Anys e Type Assertions:**
  - 🔴 **PROIBIDO:** Uso de `any` ou coerções manuais perigosas (ex: `as InterfaceCustomizada`).
  - 🟢 **OBRIGATÓRIO:** Exija Tipagem Estrutural (Duck Typing). Confie estritamente nos tipos gerados pelo GraphQL Codegen. Para subtipos, derive nativamente (ex: `type Item = NonNullable<Query['campo']>[number]`).
- **Segurança de Nulidade e Fallbacks:**
  - 🔴 **PROIBIDO:** Forçar a nulidade com o operador Non-null Assertion (`!`). Usar `undefined` para omitir dados de domínio. Usar operadores lógicos `||` que falham e anulam valores válidos como `0` ou `false`.
  - 🟢 **OBRIGATÓRIO:** Omissões utilizam `null`. Utilize fallback seguro (`param ?? ""`) combinado com proteção declarativa de rede (`skip: !param`). Acessos profundos utilizam Optional Chaining (`?.`). Fallbacks devem ser injetados logo na extração/desestruturação (ex: `const { flashcards = [] } = data ?? {}`).
- **Tratamento de Exceções e Estado:**
  - 🔴 **PROIBIDO:** Declarar blocos `catch` cegos. Usar `switch/case` em Enums de Máquina de Estado sem tratamento para rotas desconhecidas.
  - 🟢 **OBRIGATÓRIO:** Em `catch(error)`, tipar como `unknown` e extrair via Type Guard (`if (error instanceof Error)`). Todo `switch/case` avaliando Enums (ex: FSRS grades) deve possuir bloco `default` atribuindo o valor a uma variável do tipo `never`.
- **Formulários Não Controlados e Variáveis de Ambiente:**
  - 🔴 **PROIBIDO:** Coerção via `as string` ao extrair `FormData`. Injetar Variáveis de Ambiente (`import.meta.env` ou `process.env`) silenciosamente nulas em instâncias de clientes.
  - 🟢 **OBRIGATÓRIO:** Utilize `parseInt(String(formData.get("campo") ?? "0"), 10)` para total segurança em runtime. Validar variáveis de ambiente instantaneamente disparando `throw new Error(...)` (Fail-Fast) se a chave não for válida.
- **Validação Pura e Centralização (Early-Fail & DRY):**
  - 🔴 **PROIBIDO:** Manter regras de validação como utilitários privados de um componente (Silos de Conhecimento).
  - 🟢 **OBRIGATÓRIO:** Extraia validações para funções puras (`validateInput: string | null`) em um diretório central (`domain/` ou `utils/`). Invoque a função como a primeira instrução (Padrão Bouncer) do manipulador de evento, abortando a requisição localmente sem onerar a rede.

## 3. Padrões React 19 e Frontend ⚛️

- **Telemetria, Pureza e Ciclo de Vida:**
  - 🔴 **PROIBIDO:** Anti-pattern _Effect for Event Handling_ (usar `useEffect` para escutar sucessos e exibir Toast). Inserir funções impuras (`Date.now()`, `Math.random()`) no render principal. Derivar estado visual (`useState`) de props que podem ser calculadas de forma síncrona.
  - 🟢 **OBRIGATÓRIO:** Eventos de usuário (Toast, limpeza) devem ser imperativos (`try/catch/finally` no Handler). Capture tempos iniciais via _Lazy Init_ (`useState(() => Date.now())`). Telemetria de latência usa `Math.round(performance.now())`. Eventos de formulário usam `React.SyntheticEvent<HTMLFormElement>`.
- **UI, TailwindCSS v4 e Responsividade:**
  - 🔴 **PROIBIDO:** CSS Grid (use apenas Flexbox); Diálogos nativos (`alert()`, `confirm()`); Assumir o Desktop como _viewport_ padrão ao estilizar.
  - 🟢 **OBRIGATÓRIO:** Tolerância Zero FOUC em rotas protegidas (mantenha Loading até confirmar Sessão). Escreva marcações _Mobile-First_ e escale via prefixos (`md:flex-row`).
- **Gerenciamento do React 19 (Isolamento, HMR e Memória):**
  - 🔴 **PROIBIDO:** Usar `forwardRef` genérico para componentes. Renderizar modais ocultos via CSS ou retornar `null` do interior do modal. Invocar `setState` após acionar `navigate()` no Router (Memory Leak). Exportar tipos/interfaces num arquivo visual `.tsx` quebrando o Vite HMR.
  - 🟢 **OBRIGATÓRIO:** A prop `ref` no React 19 é nativa. Isole o parser (`react-markdown` + `rehype-katex`) num `<MarkdownRenderer/>` protegido por um `ErrorBoundary`. Oculte modais desmontando a árvore no pai (`{isOpen && <Modal/>}`). Desative _flags_ de loading estritamente antes do roteamento. Arquivos `.tsx` exportam exclusivamente o componente, contextos usam tríades isoladas, tipos moram em `.ts`.
- **Fallback de Paginação e Estabilidade do Compiler:**
  - 🔴 **PROIBIDO:** Renderizar milhares de nós no DOM caso o backend ainda não possua `$limit`. Injetar _Optional Chaining_ dinâmico (`data?.deck`) no array de dependências de hooks.
  - 🟢 **OBRIGATÓRIO:** Fatie a exibição de listas localmente em complexidade O(1) (`array.slice(0, visibleCount)`). Em hooks, extraia a referência estável para constante (`const deck = data?.deck ?? null;`) e assine-a univocamente no corpo e dependências.

## 4. Apollo Client v4.2.7 e GraphQL 🚀

- **Infraestrutura e Interceptadores (Links):**
  - 🔴 **PROIBIDO:** Misturar imports de Client e Hooks. Utilizar a factory obsoleta `setContext`. Injetar genéricos falsos em hooks visual. Callbacks depreciadas (`onError`/`onCompleted`) em `useQuery`.
  - 🟢 **OBRIGATÓRIO:** Segregue `@apollo/client/core` de `@apollo/client/react`. Use `SetContextLink` e _Duck Typing_ estrito no corpo (`"headers" in prevContext`). Use `TypedDocumentNode` auto-gerado do Codegen. Trate efeitos em `useEffect` isolados. Use Fragment Colocation.
- **Cache, SSOT e Limpeza (Zero-Overfetching):**
  - 🔴 **PROIBIDO:** Tipar mal o `cache.modify`; buscar via índice posicional em array; depender de contadores SQL estáticos (`_count`) se a coleção física real já está no Cache. Evict órfão sem `gc()`. Instrução `return incoming` em paginação infinita.
  - 🟢 **OBRIGATÓRIO:** Assine tipos estritos como `readonly Reference[]` filtrando via ID com `readField`. Derive contadores diretamente do `array.length` no cliente (SSOT). Aplique explicitamente `cache.gc()` logo após cada `cache.evict({ id })`. Paginações exigem `keyArgs: false` combinadas a uma `merge` function deduplicando IDs através de `new Set()`.
- **Fronteira de Autogeração (Schema-First Sync):**
  - 🔴 **PROIBIDO:** Injetar argumentos fantasmas (ex: `$limit`) em _queries_ se a API/Schema não suportar. Tentar tipar ou formatar (ESLint) o diretório auto-gerado de forma manual.
  - 🟢 **OBRIGATÓRIO:** Execute `npm run generate` como lei absoluta de contrato AST. Suprima o linter nos artefatos injetando `ignores: ["src/gql/**/*"]` na configuração global.

## 5. NestJS e Prisma ORM (Backend) ⚙️

- **Persistência Estrutural e Tipagem:**
  - 🔴 **PROIBIDO:** Omitir instruções primitivas nativas (como `@db.Uuid`) destruindo a indexação B-Tree. Fazer migração `text` para `uuid` permitindo `DROP COLUMN` automático. Campos soltos sem assobios de classe.
  - 🟢 **OBRIGATÓRIO:** Force a tipagem em branco e cast nativo (`prisma migrate dev --create-only` seguido de `ALTER COLUMN "id" TYPE UUID USING "id"::uuid;`). Validação Code-First impõe obrigatoriamente junção de `@Field({ nullable: true })` + `@IsOptional()` em nulos e asserções `propriedade!:` nas chamadas estritas.
- **Otimizações e Problema N+1:**
  - 🔴 **PROIBIDO:** Atrasar desestruturação de Payload no código; Overfetching via Prisma usando `include` genérico; Resolver nós aninhados via `@ResolveField()` cego sem o padrão de Dataloader. Criações assíncronas avulsas.
  - 🟢 **OBRIGATÓRIO:** Desestruture payloads na assinatura/primeira linha. Extraia estritamente propriedades via Prisma `select`. Agrupe relacionamentos e hierarquias (`select`) logo na Query principal. Garanta criação conjunta (Flashcard + FSRS_Data) sob a mesma `query/create` atômica relacional.

## 6. Anti-patterns Fatais e Boas Práticas 🚫

- **Limpeza Estrutural e de Componentes:**
  - 🔴 **PROIBIDO:** God Objects/Functions ferindo SRP. Vazamento de zeros não-booleanos no JSX (`cards.length && <Deck/>`). Condicionais protegendo _arrays_ que já superaram bloqueio ou tratando Array vazio (`{lista && <Lista />}`). Deixar Closures velhas órfãs vazando na RAM (Thrashing).
  - 🟢 **OBRIGATÓRIO:** Fragmentação máxima; uso estrito de booleanos absolutos (`length > 0 && <Deck/>`); O tratamento de _Empty State_ visual de Array vazio é responsabilidade exclusiva do Subcomponente filho. _Event Listeners_ assíncronos obrigam uso do Padrão _Latest Ref_ com purga via _Cleanup_ no Unmount.

## 7. Roteamento e Composição de Interface (UI Architecture) 🧩

- **Abolição de God Objects Visuais e Sanitização:**
  - 🔴 **PROIBIDO:** Validar parâmetros dinâmicos de URL (ex: checar `!deckId` no meio de um JSX pesado na página de sessão). Páginas agregarem múltiplos lógicos visuais passando de 200 linhas sem modulação.
  - 🟢 **OBRIGATÓRIO:** A validação higiênica e _Bouncer_ do roteador é delegada a interceptadores genéricos (ex: `<RequireParam/>` envolto no `Outlet`). O diretório `pages/` abriga apenas Orquestradores Puros de Estado (GraphQL). Blocos lógicos de interface viram _Dumb Components_ fragmentados obrigatórios dentro de `components/`.

## 8. Estabilidade do React e Event Loop 🔄

- **Proteção de Eventos DOM contra Thrashing:**
  - 🔴 **PROIBIDO:** Repassar funções anônimas literais diretamente em propriedades de subcomponentes filhos críticos (ex: Modal de Escuta recebendo `onClose={() => setOpen(false)}`).
  - 🟢 **OBRIGATÓRIO:** Toda função que desce como propriedade e engatilha controle de ciclos de vida e eventos de teclado no subcomponente deve ser incondicionalmente estabilizada em memória via hook `useCallback`.

## 9. Operações Otimistas e Zero-Overfetching (Apollo Avançado) 🕸️

- **Manipulações Orgânicas e SSOT:**
  - 🔴 **PROIBIDO:** Após executar a criação unitária num endpoint, disparar `refetchQueries` para atualizar as listas pesadas visuais. Após processar uma exclusão lógica, disparar requisições compensatórias cegas na mesma lista.
  - 🟢 **OBRIGATÓRIO:** Aplique Inserção Otimista em O(1): Após a Mutation de criação, utilize o `cache.modify` na entidade pai injetando o novo objeto imutável via `toReference`. Na exclusão, confie na reatividade plena e instantânea da instrução `cache.evict` + `cache.gc()` no Normalized Cache (A Única Fonte da Verdade na UI).

## 10. Resoluções de Conflito de Análise Estática (React Compiler e Linter) 🤖

- **Engenharia Defensiva no Array de Dependências:**
  - 🔴 **PROIBIDO:** Expressões lógicas (`!isFlipped`), _Optional Chaining_ (`data?.deck`), Fallbacks matemáticos de nulidade (`?? []`) diretamente dentro do Array Sintático dos Hooks (`useCallback / useEffect / useMemo`).
  - 🟢 **OBRIGATÓRIO:** Arrays de Dependência suportam unicamente primitivos assinados e estáveis oriundos da rede. Se for necessário vigiar, extraia a propriedade primitiva pro escopo local estabilizado (`const id = obj?.id`) e assine `[id]`. Coalescências devem habitar a guarda isolada (_In-Callback Guard_) na lógica de execução da função.

## 11. Limites do Vite HMR (Hot Module Replacement) ⚡

- **Fronteira Estrita de Exportação Visual:**
  - 🔴 **PROIBIDO:** Exportar funções não-visuais, `types`, `interfaces` ou lógicas complexas no mesmo arquivo `.tsx` que contém o componente React. Isso aborta a injeção a quente (Fast Refresh) do Vite e obriga um recarregamento total da página (_Full Page Reload_).
  - 🟢 **OBRIGATÓRIO:** Arquivos terminados em `.tsx` devem exportar estritamente o Componente React primário (Anotação de UI). Encapsule lógicas secundárias e tipos em arquivos `.ts` puramente lógicos.

## 12. Gestão Defensiva do Apollo Client e Infinite Scroll 📚

- **A Falácia do "return incoming" em Coleções (Stale Cache Destrutivo):**
  - 🔴 **PROIBIDO:** Em requisições de coleções no `InMemoryCache` para paginação, usar a instrução padrão `return incoming`. Ela apaga sumariamente a memória dos itens já carregados anteriormente na rolagem.
  - 🟢 **OBRIGATÓRIO:** Configure explicitamente a `TypePolicy` no cache, desativando a separação de chaves (`keyArgs: false`) e escrevendo uma função `merge` personalizada.
- **Merge de Deduplicação (Custo O(1)):**
  - 🔴 **PROIBIDO:** Em funções `merge` de paginação infinita, iterar dados usando `array.includes()` ou `array.find()`, o que causa gargalo de performance exponencial.
  - 🟢 **OBRIGATÓRIO:** Crie um `new Set()` baseado em `readField('id')` para deduplicar nós entrantes e existentes. Isso garante acumulação segura no cache e validações instantâneas.
- **Prevenção do Padrão "Silo de Conhecimento" (SSOT):**
  - 🔴 **PROIBIDO:** Replicar regras e lógicas de validação de formulários (como tamanho mínimo de string) dentro de componentes visuais modais (ex: `CreateDeckModal`, `EditFlashcardModal`).
  - 🟢 **OBRIGATÓRIO:** Funções de checagem universal devem sempre ser importadas de um diretório central de negócios (ex: `domain/validators.ts`), preservando o princípio DRY (Don't Repeat Yourself).

## 13. Orquestração Visual e Inversão de Controle (IoC) 🎨

- **Inversão de Controle em Componentes Genéricos (Agnostic Wrappers):**
  - 🔴 **PROIBIDO:** Componentes de infraestrutura visual ou motores de leitura (como renderizadores nativos Markdown/LaTeX) definirem suas próprias classes absolutas de cor (ex: `text-white` hardcoded). Isso destrói a transição de temas (_Light/Dark Mode_).
  - 🟢 **OBRIGATÓRIO:** Componentes base devem receber o tema por herança via prop `className`, transferindo a responsabilidade do contraste e da Harmonia Visual (UI02) estritamente para o orquestrador que os invoca.
- **Fim das Flags de Bloqueio em Mutações Otimistas (YAGNI):**
  - 🔴 **PROIBIDO:** Declarar variáveis de estado locais estáticas (ex: `isSubmitting` ou `disabled={loading}`) para congelar a interface quando o Apollo Client já atua com uma estratégia de _Optimistic UI_.
  - 🟢 **OBRIGATÓRIO:** Se a mutação insere ou altera o dado na árvore virtual em 0ms (UI Otimista), mantenha a via de interação do componente livre de _loaders_ (exceção feita apenas a envios irreversíveis, como pagamentos). Isso preserva o _Cognitive Flow_ (UI04).

## 14. Performance de Renderização e Ciclo de Efeitos ⚙️

- **Erradicação de Renderizações em Cascata (Cascading Renders):**
  - 🔴 **PROIBIDO:** Usar `useEffect` para escutar alterações em variáveis e disparar a atualização de um estado visual secundário (ex: acionar `setIsFlipped(false)` como reação a uma mutação completada via prop).
  - 🟢 **OBRIGATÓRIO:** Reajustes visuais secundários devem ocorrer imperativamente dentro da mesma função manipuladora de evento (`handleRating`) que disparou a requisição primária. Isso evita re-renders punitivos duplos na arquitetura do React 19.
- **Estabilização Primitiva de Dependências em Hooks:**
  - 🔴 **PROIBIDO:** Ao memoizar funções ou efeitos que dependem de respostas complexas (Nós do GraphQL), passar o objeto inteiro (ex: `card`) ou usar _Optional Chaining_ direto (`card?.id`) dentro do array lógico (`[card?.id]`).
  - 🟢 **OBRIGATÓRIO:** A extração e rastreamento exclusivo de valores primitivos pacifica a análise estática e previne ativamente o efeito colateral de encapsulamentos obsoletos (_stale closures_). Extraia antes: `const id = card?.id;` e assine o primitivo `[id]`.

## 15. Regras Específicas do Domínio FSRS (Motor de Estudos) 🧠

- **Prevenção de Envenenamento de Dataset (Regra RN02):**
  - 🔴 **PROIBIDO:** Ao editar a "Frente" ou "Verso" de um flashcard, sobrescrever o conteúdo silenciosamente no banco de dados, misturando a estatística antiga à nova semântica da pergunta.
  - 🟢 **OBRIGATÓRIO:** A UI de edição exige um _Prompt/Modal_ de confirmação se o card já possuir logs. A interface deve enviar um booleano ao backend (`resetProgress`). Se confirmado (mudança de semântica), o backend deve forçar o recálculo e zerar as variáveis estocásticas (`Stability / Difficulty`) para não corromper a rede neural de estudos.
- **Operação Zero-Latency e UX Baseada em Teclado (UI04):**
  - 🔴 **PROIBIDO:** Telas de repetição de alto volume com bloqueios via mouse, _loaders_ no clique de resposta ou transições impeditivas de latência artificial.
  - 🟢 **OBRIGATÓRIO:** Navegação fluida garantida via teclado (_Shortcuts_: Espaço/Enter = Flip; Numéricos 1 a 4 = Ratings). A telemetria temporal (milissegundos avaliados) deve ser rastreada de forma furtiva pelo `useRef` e enviada à API GraphQL silenciosamente sem penalizar a exibição do próximo cartão.

## 16. UX Defensiva e Feedback de Interface (Anti-Silent Fail) 🚨

- **Feedback Obrigatório no Padrão Bouncer:**
  - 🔴 **PROIBIDO:** Usar `return;` limpo para abortar o fluxo num bloco de validação condicional caso a culpa seja de um input do usuário. Omissões violam as Heurísticas de Nielsen (Visibilidade do Status).
  - 🟢 **OBRIGATÓRIO:** Todo evento bloqueado por erro do cliente exige resposta acionando a camada local de notificações (ex: `showToast("E-mail incorreto", "error")`).
- **Bloqueio Físico vs. Optimistic UI:**
  - 🔴 **PROIBIDO:** Misturar estratégias de rede. Trancar a UI com `disabled={loading}` em eventos estocásticos (FSRS, Ler Cartão) ou deixar rotas críticas abertas para _Double Submit_ (Signup, Login).
  - 🟢 **OBRIGATÓRIO:** Mutações externas ou dependentes de segurança requerem bloqueio físico de tela. Mutações de rotina exigem a estratégia contrária (UI Otimista).
- **Tratamento de Rollback Otimista:**
  - 🔴 **PROIBIDO:** Seccionar o try/catch ignorando a comunicação em caso de falhas num request com _Optimistic Response_.
  - 🟢 **OBRIGATÓRIO:** Em um `catch` onde a UI se adiantou e falhou na API, a interface deve alertar claramente: _"Erro de rede. A ação foi revertida."_

## 17. Segurança de Rede e Backend (NestJS) 🧱

- **Filtros Globais de Exceção (Data Masking):**
  - 🔴 **PROIBIDO:** O NestJS devolver as falhas nativas em cru do ORM para o front (ex: vazar na API um JSON contendo `PrismaClientKnownRequestError: P2002`).
  - 🟢 **OBRIGATÓRIO:** Utilizar `Exception Filters` no NestJS para interceptar erros sistêmicos e mascará-los com traduções limpas e sanitizadas (ex: "O registro já existe.").
- **Sanitização Estrita de DTOs (Mass Assignment):**
  - 🔴 **PROIBIDO:** Receber _payloads_ cegos via rota sem limitação de campos permitidos.
  - 🟢 **OBRIGATÓRIO:** Utilizar o `ValidationPipe` do NestJS obrigatoriamente ligado às diretivas `whitelist: true` e `forbidNonWhitelisted: true`, rejeitando qualquer nó de rede abusivo que vise escalada de privilégios.
- **Isolamento de Rate Limiting:**
  - 🔴 **PROIBIDO:** Endpoints públicos (autenticação, cadastro, reset) expostos em alta frequência.
  - 🟢 **OBRIGATÓRIO:** Implementar restrição de picos (_Throttling_ / Rate Limit) no NestJS visando prevenir exaustão financeira em instâncias do Supabase Auth (DDoS).

## 18. Acessibilidade (a11y) e Navegação por Teclado ♿

- **Contenção de Eventos de Teclado (Scroll Jump):**
  - 🔴 **PROIBIDO:** Configurar `eventListener` em atalhos vitais (como `Space` ou `Enter`) que disparem efeitos colaterais visuais (como `Page Down`), perdendo a rolagem da tela do aluno.
  - 🟢 **OBRIGATÓRIO:** Acionar obrigatoriamente o bloqueio da interação nativa via `e.preventDefault()` na captura segura dos atalhos primários do fluxo.
- **Focus Trap em Modais:**
  - 🔴 **PROIBIDO:** Modais abertos que permitam ao cursor (tecla `Tab`) circular pelos elementos de trás (`body`), gerando submissão acidental de conteúdo invisível.
  - 🟢 **OBRIGATÓRIO:** Prender a navegação circular isolada ao DOM do modal e, ao fechar a janela, restaurar programaticamente o estado nativo devolvendo o foco para o elemento original invocado (`document.activeElement`).

## 19. Otimização de Contextos React (Evitando Re-renders em Cascata) 🏎️

- **Memoização do Value em Providers:**
  - 🔴 **PROIBIDO:** Declarar objetos literais efêmeros como a propriedade injetada num container mestre (`<AuthContext.Provider value={{ user, session }}>`). Isso emula uma destruição de escopo e regera renderizações destrutivas em massa na árvore de componentes descendente.
  - 🟢 **OBRIGATÓRIO:** A propriedade visual enviada para os provedores (`value`) tem que ser estabilizada fisicamente como variável via hook `useMemo`, blindando contra _Cascading Renders_.

## 20. Padrões de Módulo e Compatibilidade de HMR 📦

- **Named Exports Estritos (Fim do `export default`):**
  - 🔴 **PROIBIDO:** Utilizar a declaração `export default` ao compor módulos (Hooks, UI, Classes lógicas). Essa herança ambígua atrapalha a varredura do TypeScript, engana a injeção estática de módulo (HMR do Vite) em caso de erro, e favorece imports cegos divergentes.
  - 🟢 **OBRIGATÓRIO:** Emita componentes obrigatoriamente através da tipologia de _Named Exports_ (ex: `export const SessionView = () => ...`).

## 21. Otimização Avançada de GraphQL e Cache (Zero-Overfetching) 🗃️

- **Contadores Derivados via TypePolicy (Interceptação de Aggregate):**
  - 🔴 **PROIBIDO:** Executar no GraphQL do Frontend uma carga completa das propriedades filhas em arrays relacionais (ex: consultar `flashcards { id }`) utilizando tráfego apenas para calcular localmente o tamanho da lista (`data.flashcards.length`).
  - 🟢 **OBRIGATÓRIO:** Em Listas longas que o Frontend não pretende renderizar no primeiro fluxo, solicite ativamente o nó estatístico agregado pelo banco (ex: `_count { flashcards }`).
- **Sincronização Ativa de Agregadores:**
  - 🔴 **PROIBIDO:** Permitir a dessincronia visual (Stale Cache) da variável `_count` do GraphQL mantendo o número estático congelado enquanto a lista paralela real em cache adiciona registros.
  - 🟢 **OBRIGATÓRIO:** A interceptação ativa de agregações via `TypePolicy`. Se o array principal (físico) já coexiste no cache local (`Array.isArray(readField('referencia_array'))`), substitua o `_count` bruto lido do banco derivando seu valor diretamente do `.length` em memória.

## 22. Developer Experience (DX) e Ferramental Contínuo 🛠️

- **Schema Watcher e Continuous DX:**
  - 🔴 **PROIBIDO:** Modificar recursos no Backend e rodar o cliente sem regenerar a _Abstract Syntax Tree_ (AST), causando falsos positivos de TypeScript na IDE.
  - 🟢 **OBRIGATÓRIO:** Manter comandos de vigilância no `package.json` (ex: `"generate:watch": "graphql-codegen -w"`).
- **Ergonomia do AST Automático em Componentes Visuais:**
  - 🔴 **PROIBIDO:** Em Modais de criação complexos (como Markdown), acoplar e forçar a montagem dupla pesada do _Editor_ e do _Preview_ simultaneamente sem necessidade.
  - 🟢 **OBRIGATÓRIO:** Separar as _Tabs_ usando puramente o Flexbox para alternância (`display: flex` contra `display: none`) ou montagem condicional direta (`!isPreviewMode ? <Editor/> : <Preview/>`).

## 23. Resiliência de Ecossistema e Contenção de Falhas (Fail-Safe) 🛡️

- **Avaliação Tardia (Lazy Evaluation) de Ambiente:**
  - 🔴 **PROIBIDO:** Lançar exceções (`throw new Error`) durante validações de `import.meta.env` ou `process.env` no escopo raiz de inicialização do módulo. Isso paralisa o navegador e ignora os Error Boundaries.
  - 🟢 **OBRIGATÓRIO:** Envelopar validações críticas de infraestrutura em callbacks/funções (ex: `() => getApiUrl()`). A falha deve explodir no tempo de renderização, acionando o `<GlobalErrorBoundary/>`.
- **Degradação Graciosa de Storage (Graceful Degradation):**
  - 🔴 **PROIBIDO:** Acessar a API `window.localStorage` ou `sessionStorage` de forma direta e síncrona em inicializadores de clientes (ex: Supabase Auth). Abas anônimas causam crash bloqueando o DOM.
  - 🟢 **OBRIGATÓRIO:** Envelopar o acesso em adaptadores contendo `try/catch` e implementar fallback silencioso para a memória RAM (ex: `new Map()`).

## 24. Prevenção a Armadilhas de Ferramental e Compilação ⚙️

- **Tolerância Zero a Auto-Imports Obsoletos (CJS vs ESM):**
  - 🔴 **PROIBIDO:** Aceitar auto-imports originados de módulos compilados CommonJS em um ecossistema nativo ES/Vite (ex: `importar de @apollo/client/react/react.cjs`). Isso duplica instâncias e quebra contextos.
  - 🟢 **OBRIGATÓRIO:** Exigir caminhos limpos dos pacotes ESM oficiais.
- **Fim do Código Morto em Contratos Visuais (Dead Code Elimination):**
  - 🔴 **PROIBIDO:** Definir propriedades fantasmas nas interfaces de props do React (ex: `onSuccess?: () => void`) que jamais são extraídas ou invocadas.
  - 🟢 **OBRIGATÓRIO:** Aplicar a regra YAGNI no nível de tipagem, podando contratos não executáveis.

## 25. Segmentação Arquitetural e Herança Visual (UI & UX Avançada) 🧩

- **Abolição Completa de God Components:**
  - 🔴 **PROIBIDO:** Orquestradores agregarem múltiplas lógicas de domínio num só arquivo (ex: Autenticação + Regras FSRS + Exclusão LGPD).
  - 🟢 **OBRIGATÓRIO:** Pulverizar o JSX massivo em subdiretórios coesos (ex: `components/settings/`). O arquivo mestre atua estritamente despachando Queries e Props.
- **Microcopy Preventivo e Sincronia de Ambiente:**
  - 🔴 **PROIBIDO:** Deixar a UI cega para divergências de ambiente do cliente que afetem regras matemáticas.
  - 🟢 **OBRIGATÓRIO:** Injetar alertas em tempo real se metadados vitais conflitarem (ex: o Fuso Horário salvo divergir do `Intl.DateTimeFormat()` do navegador), exigindo adequação.
- **Herança Estrita de Tema Base:**
  - 🔴 **PROIBIDO:** O `MainLayout` repassar classes forçadas (`bg-slate-50`) aos filhos apenas para satisfazer um `<Header/>` estático de contraste light, cegando componentes profundos.
  - 🟢 **OBRIGATÓRIO:** O layout pai aplica o escopo absoluto da rota (`bg-slate-950`). Componentes ilhados controlam localmente seu contraste inverso.

## 26. Auditoria Visual em Cascata (Subtree Audit) 🎨

- **Sincronia Temática Obrigatória:**
  - 🔴 **PROIBIDO:** Ao inverter um layout raiz para _Dark Mode_ (`bg-slate-950`), ignorar filhos que retiveram as antigas classes estáticas de modo claro (ex: ilhas brancas `bg-white`, `text-slate-800`).
  - 🟢 **OBRIGATÓRIO:** Aplicar varredura recursiva na árvore substituindo os remanescentes por equivalentes nativos de alto contraste (ex: `bg-slate-900`, `text-slate-100`).

## 27. Defesa em Interceptadores Assíncronos (Network Links Fail-Safe) 🌐

- **Proibição de Crash em Midlewares (Apollo Link):**
  - 🔴 **PROIBIDO:** Em interceptadores como `SetContextLink` do Supabase, utilizar um bloco `catch` vazio ou que lance o erro ao vento. Isso mata o fluxo inteiro do GraphQL no cliente.
  - 🟢 **OBRIGATÓRIO:** O `catch` da rede deve obrigatoriamente forçar o _fallback_ do contrato esperado (ex: `return { headers: fallbackHeaders };`).

## 28. Comportamento de Wrappers no Roteamento React 🔄

- **Responsabilidade Estática do Layout:**
  - 🔴 **PROIBIDO:** Injetar propriedades de domínio mutáveis diretamente em subcomponentes do Wrapper (`<Outlet />`).
  - 🟢 **OBRIGATÓRIO:** Ancoragens visuais (como o `<Header/>`) dentro do Layout Mestre devem invocar seus próprios Hooks e consumir seu Cache/Global State de modo autônomo.

## 29. Infraestrutura de Workspace e Monorepos (VS Code) 📁

- **Topologia de Ponto Único (SSOT da IDE):**
  - 🔴 **PROIBIDO:** Fragmentar e ocultar regras do VS Code em subpastas aninhadas (`./frontend/.vscode/`). A IDE ignora essas regras.
  - 🟢 **OBRIGATÓRIO:** Manter `settings.json` na raiz absoluta. Servidores de linguagem (LSP) exigem mapeamento ostensivo: `"eslint.workingDirectories": ["./frontend", "./backend"]`.

## 30. Orquestração de Linters vs. Formatters ⚖️

- **Prevenção de Colisão no Auto-Save:**
  - 🔴 **PROIBIDO:** Permitir que ESLint e Prettier tentem indentar os arquivos simultaneamente provocando concorrência de formatador na IDE.
  - 🟢 **OBRIGATÓRIO:** Segregar responsabilidades em `settings.json`. ESLint opera apenas lógica/correções (`"source.fixAll.eslint": "explicit"`). Prettier formata a estética pura (`"editor.defaultFormatter": "esbenp.prettier-vscode"`).

## 31. TailwindCSS v4 e Validação de CSS Nativo 🎨

- **Erradicação do `@apply` e Validação Limpa:**
  - 🔴 **PROIBIDO:** Tentar compilar classes personalizadas com a diretiva obsoleta `@apply` no Tailwind v4.
  - 🟢 **OBRIGATÓRIO:** Consumir nativamente as variáveis CSS expostas globais (ex: `color: var(--color-slate-900)`). Silenciar os validadores antigos na IDE (`"css.lint.unknownAtRules": "ignore"`) e delegar validação à extensão oficial: `"tailwindCSS.includeLanguages": { "css": "css" }`.

## 32. Auditoria de Tooling e Manutenção Contínua 🛠️

- **Tolerância Zero a Chaves Obsoletas (Deprecation):**
  - 🔴 **PROIBIDO:** Arrastar chaves de infraestrutura defasadas e scripts legados (ex: usar `typescript.tsdk` destruindo o _IntelliSense_).
  - 🟢 **OBRIGATÓRIO:** Validação frequente do mapa de configurações ativas, transferindo para a versão suportada (ex: `js/ts.tsdk.path`).

## 33. Infraestrutura de DOM e Eventos Globais (DRY e Memory Safety) 🖱️

- **Abstração Obrigatória de Interações Nativas (DRY):**
  - 🔴 **PROIBIDO:** Espalhar lógica repetitiva de manipulação direta do DOM (ex: `window.addEventListener`, `document.querySelectorAll`) diretamente no corpo de componentes visuais (Páginas ou Modais).
  - 🟢 **OBRIGATÓRIO:** Comportamentos transversais de UX, como _Focus Traps_ (para A11y) ou atalhos globais de teclado (UI04), devem ser isolados em **Custom Hooks puros** (ex: `useFocusTrap`). A UI apenas invoca o hook passando a `ref`.
- **Resolução Tardia de Nós Dinâmicos (Dynamic DOM Refs):**
  - 🔴 **PROIBIDO:** Armazenar coleções de nós do DOM (`querySelectorAll`) no momento da montagem (`mount`) do `useEffect` caso os elementos filhos dependam de requisições assíncronas (ex: formulários aguardando uma query GraphQL). Isso gera _Dangling Pointers_ (ponteiros órfãos).
  - 🟢 **OBRIGATÓRIO:** Realizar a varredura de elementos tabuláveis estritamente **dentro da função de callback do evento** (ex: `handleKeyDown`). O teclado deve sempre interagir com a árvore viva do DOM no exato milissegundo do disparo.
- **Restauração Educada de Foco (A11y Flow):**
  - 🔴 **PROIBIDO:** Desmontar modais ou sobreposições e largar o foco do teclado no limbo (foco rebaixado para o `<body>`), forçando o usuário a tabular tudo novamente.
  - 🟢 **OBRIGATÓRIO:** Todo Hook de sobreposição visual deve gravar quem era o `document.activeElement` antes de sua abertura (via `useRef`) e, na função de _cleanup_ (desmontagem), devolver o foco obrigatoriamente a esse elemento original.

## 34. Coerção de Tipos e Precedência Lógica (O Paradoxo do NaN) 🧮

- **Precedência Estrita na Coalescência de Nulos:** Ao extrair valores brutos de APIs nativas não-tipadas (como `FormData.get()`), a proteção contra nulidade (`??`) deve ser executada de forma envelopada, **antes** do Cast estrutural.
  - 🔴 **PROIBIDO:** `String(formData.get("id")) ?? "0"` -> Se o campo for nulo, a coerção nativa do JS transforma em `"null"`, ignorando o operador `??` e gerando um erro de `NaN` se passado para validações matemáticas.
  - 🟢 **OBRIGATÓRIO:** `String(formData.get("id") ?? "0")` -> O operador de coalescência deve proteger a extração primitiva antes de qualquer mutação de tipo.

## 35. Validação em Fronteiras de Rede (Strict Type Guards em Enums) 🛡️

- **Validação O(1) de Enums Constantes:** Ao receber primitivos assíncronos da fronteira de rede (ex: um `number` devolvido pelo Apollo representando o estado algorítmico do FSRS), a validação contra o Dicionário de Dados local deve forçar o _Type Casting_.
  - 🔴 **PROIBIDO:** Usar iteradores passivos como `Object.values(FsrsState).includes(state)`. No TypeScript, isso destrói a inferência, rebaixando a checagem estatística para `any[]` ou gerando alertas em transpiladores estritos (Babel/Vite).
  - 🟢 **OBRIGATÓRIO:** Assegurar a integridade aplicando Cast seguro na extração: `const validValues = Object.values(FsrsState) as number[]; return validValues.includes(state);`.

## 36. Integridade de Domínio e Validação Universal (Prevenção de Falsos Positivos) ⚖️

- **Sincronia Estrita de Contratos (Criação e Edição):**
  - 🔴 **PROIBIDO:** Escrever lógicas isoladas ou arquivos de validação paralelos para as interfaces de `Criação` e `Edição` que pertencem a uma mesma entidade no domínio.
  - 🟢 **OBRIGATÓRIO:** Ambas as interfaces devem importar e consumir rigorosamente a mesma função pura alocada em um diretório de negócio central (ex: `domain/validators.ts`). Isso garante a consistência matemática do banco, impedindo que o fluxo de atualização injete dados que seriam originalmente rejeitados na criação inicial.

## 37. Orquestração de Fluxo e Indentação Linear (Bouncer Visual) 🛑

- **Rejeição Prematura de Estados Temporários:**
  - 🔴 **PROIBIDO:** Envelopar a árvore JSX principal em grandes blocos condicionais (`if (session) { return <Page/> }`), gerando "código em cunha" (_Hadouken Indentation_) e complexidade ciclomatica desnecessária.
  - 🟢 **OBRIGATÓRIO:** Adote o Padrão Bouncer visualmente. Intercepte estados inoperantes (como variáveis vazias, `loading` de rede ou ausência de sessão) nas primeiras linhas do orquestrador via um `return` implícito. Isso mantém a indentação do JSX principal sempre plana em O(1).

## 38. Limpeza de Escopo e Guardas Redundantes no JSX 🧹

- **Erradicação de Checagem Dupla (Double Checking):**
  - 🔴 **PROIBIDO:** Utilizar avaliação de curto-circuito (ex: `{data && <Component />}`) no interior da renderização para proteger variáveis que já engatilharam e superaram o Early Return no topo do módulo.
  - 🟢 **OBRIGATÓRIO:** Assuma a estabilidade estática do TypeScript. Se a propriedade não caiu na malha da guarda inicial (`if (!data) return <Skeleton/>;`), ela é matematicamente _NonNullable_. Monte a árvore secundária de forma declarativa e limpa.

## 39. UX de Foco Cognitivo e Contenção de "Modo Imersivo" 🌌

- **Isolamento de Contraste para Sessões de Active Recall:**
  - 🔴 **PROIBIDO:** Contaminar o orquestrador global (`MainLayout`) forçando parâmetros globais de Tema Escuro profundo para satisfazer unicamente o fluxo de estudo, o que aniquila o contraste legível em telas administrativas paralelas.
  - 🟢 **OBRIGATÓRIO:** O "Modo Imersivo" (Dark Mode de alto contraste e foco) deve pertencer arquiteturalmente a invólucros isolados. Monte esse ecossistema apenas em rotas exclusivas dedicadas a fluxos de carga cognitiva pesada, separando-as fisicamente do roteamento padrão da plataforma.

## 40. Resolução de Colisões em Consultas GraphQL (Aliases Mapeados) 🔗

- **Prevenção de Sobrescrita de Identificadores:**
  - 🔴 **PROIBIDO:** Executar no mesmo contexto reativo múltiplas _Queries_ ou fragmentos que extraiam nós com exato mesmo nome (ex: `data.user` e `data.user`), empurrando a resolução para renomeações destrutivas na desestruturação JavaScript.
  - 🟢 **OBRIGATÓRIO:** Utilize _Aliases_ nativos do servidor diretamente na string da AST GraphQL (ex: `author: user(id: $authorId)`). Isso delega ao Apollo a responsabilidade de segmentação, preservando variáveis seguras na interface visual.

## 41. Conformidade de Dados e Destruição Estrita (LGPD) 🗑️

- **Erradicação da Exclusão Lógica Primitiva:**
  - 🔴 **PROIBIDO:** Implementar o padrão obsoleto de _Soft Delete_ tradicional baseado na inversão de _flags_ booleanas (ex: `isDeleted = true`) que retém artefatos, log ou metadados sigilosos de forma legível após a submissão de encerramento do vínculo pelo usuário.
  - 🟢 **OBRIGATÓRIO:** O fluxo de desligamento ou exclusão sensível exige a **Anonimização Irreversível**. Quando restrições de chaves estrangeiras impossibilitarem um _HARD DELETE_ imediato, os registros vitais da base devem ser sobrescritos no momento da ação por criptografia irreversível (_Hashes_ nulos) ou mascarados programaticamente na camada Prisma.

## 42. Isolamento de Renderização em Provedores Globais (Providers) 🏎️

- **Memoização Obrigatória de Instâncias Sistêmicas:**
  - 🔴 **PROIBIDO:** Transportar primitivos instáveis (objetos e funções anônimas literais) de forma exposta na propriedade `value` de Provedores de Alta Hierarquia (ex: `AuthProvider`, `ToastProvider`).
  - 🟢 **OBRIGATÓRIO:** Em orquestradores raízes do React 19, a alocação de propriedades visuais e funções vitais transmitidas aos Provedores tem que ser estabilizada incondicionalmente através de hooks de memória de longo prazo (`useMemo` e `useCallback`), sufocando pela raiz renderizações massivas em cascata (_Thrashing_).

## 43. Operações Otimistas e Assinaturas de Tipagem (Strict UI Contracts) ⚡

- **Abolição de Promises em Optimistic UI:**
  - 🔴 **PROIBIDO:** Tipar callbacks de salvamento/deleção em componentes visuais como `Promise<boolean>` ou possuir estados locais de `loading` quando a mutação parente utiliza `optimisticResponse` no Apollo Client.
  - 🟢 **OBRIGATÓRIO:** Se a mutação resolve a UI em 0ms (Fire-and-Forget), o contrato passado para a prop do componente deve ser estritamente `void`. A responsabilidade pelo tratamento de erros muda do componente visual para o bloco `.catch()` assíncrono do hook orquestrador.

- **Nulidade Estrita vs Parâmetros Opcionais (GraphQL Bridge):**
  - 🔴 **PROIBIDO:** Usar o operador de parâmetro opcional do TypeScript (`sourceContext?: string | null`) na passagem de dados de domínio entre Formulários e Hooks. Isso injeta implicitamente `undefined`, que não mapeia corretamente para mutações GraphQL controladas.
  - 🟢 **OBRIGATÓRIO:** Exija a presença física do argumento tipando estritamente como `sourceContext: string | null`. O componente consumidor deve ser forçado a declarar `null` caso a informação não exista.

## 44. Orquestração de Efeitos Colaterais e Separação de Preocupações (Side-Effects Orchestration) 🛠️

- **Delegação de Destruição Sistêmica (Dumb Visual Components):**
  - 🔴 **PROIBIDO:** Componentes de interface (como `Header`, `Layout` ou botões de navegação) importarem instâncias de banco de dados ou orquestradores de cache (ex: `useApolloClient().clearStore()`) para limpar dados durante fluxos como Logout ou Deleção de Conta.
  - 🟢 **OBRIGATÓRIO:** O componente visual é um mensageiro. Ele deve apenas emitir a Intenção (ex: invocar `await logout()`). A responsabilidade física de purgar o _Tenant_ (destruir tokens e limpar a RAM) pertence exclusivamente à camada abstrata de Contexto/Provedores de Domínio (ex: `AuthProvider`).

## 45. Proteção de Componentes Virtuais (Zero-Latency Tear-down) 🧹

- **Desmontagem Síncrona vs Assíncrona:**
  - 🔴 **PROIBIDO:** Manter o _state_ de renderização de um modal ativado enquanto se aguarda um `await` que fechará a tela posteriormente.
  - 🟢 **OBRIGATÓRIO:** Em operações não-destrutivas munidas de _Optimistic UI_, o _Tear-down_ (fechamento do Modal via `setState(null)`) deve ser síncrono e instantâneo na view orquestradora. O fluxo não deve aguardar a rede para liberar a interação do usuário.

## 46. Acessibilidade Dinâmica e Leitores de Tela (A11y) 📢

- **Visibilidade de Componentes Flutuantes:**
  - 🔴 **PROIBIDO:** Renderizar componentes de feedback de interface (como _Toasts_, _Snackbars_ ou _Alerts_ dinâmicos) sem sinalização para tecnologias assistivas, "cegando" os usuários que dependem de leitores de tela (Screen Readers).
  - 🟢 **OBRIGATÓRIO:** Injetar o atributo `aria-live="polite"` (ou `assertive` em erros críticos) no contêiner mestre dessas notificações. Isso garante que a Web API do navegador narre o feedback assíncrono (ex: "Flashcard criado!") sem roubar o foco ou abortar a interação vigente do estudante, alinhando-se às diretrizes de UX inclusiva do projeto.

## 47. Sintaxe Enxuta de Contextos (Padrões React 19) ⚛️

- **Omissão do Sufixo Provider (AST Optimization):**
  - 🔴 **PROIBIDO:** Utilizar a sintaxe legada e verbosa `<Context.Provider value={...}>` na montagem de provedores de estado global em projetos que operam na versão 19+ do React.
  - 🟢 **OBRIGATÓRIO:** Omitir o `.Provider` e utilizar diretamente o objeto do contexto como empacotador (ex: `<AuthContext value={contextValue}>`). Essa prática reduz o encapsulamento obsoleto e resulta em uma _Abstract Syntax Tree (AST)_ mais limpa e rápida na camada de reconciliação (Fiber Tree).

## 48. Segurança Atômica em Desmontagem de Efeitos (Fail-Safe Cleanups) 🧹

- **Prevenção de NullReferenceException no Unmount:**
  - 🔴 **PROIBIDO:** Invocar métodos diretos do Web API em referências capturadas via `useRef` dentro de funções de _cleanup_ do `useEffect` (ex: `previousFocusRef.current.focus()`) contando apenas com a intuição ou checagens simples de sintaxe (`if (ref.current)`).
  - 🟢 **OBRIGATÓRIO:** Aplicar invariavelmente o Operador de Encadeamento Opcional Absoluto (`?.`) na restauração de estados do DOM (ex: `previousFocusRef.current?.focus()`). Como a referência pode ser perdida ou nunca engatilhada (dependendo de quem originou o evento), o operador silencia a rota e impede um _Full Crash_ no DOM virtual caso o ponteiro retorne nulo.

## 49. Proteção Estrita em Nós do DOM (Type Guards vs Coerção) 🛡️

- **Validação Matemática de Elementos HTML:**
  - 🔴 **PROIBIDO:** Forçar a tipagem de ponteiros nativos do DOM utilizando _Type Assertions_ (ex: `document.activeElement as HTMLElement` ou `Array.from(nodeList) as HTMLElement[]`). Isso "mente" para o compilador e mascara retornos incompatíveis, como elementos `<svg>` isolados ou `null`, que quebrarão a aplicação em _runtime_.
  - 🟢 **OBRIGATÓRIO:** Utilizar _Type Guards_ puros avaliados em tempo de execução (`if (activeElement instanceof HTMLElement)`). Ao iterar ou mapear listas de nós (NodeLists), é obrigatório o uso de _Type Predicates_ para higienizar o array (`.filter((node): node is HTMLElement => node instanceof HTMLElement)`). A validação deve ser baseada na corrente de protótipos real da V8 Engine, garantindo integridade absoluta.
