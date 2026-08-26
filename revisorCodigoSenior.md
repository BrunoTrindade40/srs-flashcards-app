# Base de Conhecimento Técnico: Revisão de Código Sênior

## 1. Escopo e Arquitetura Global (MVP - Fase 1) 🏗️
* **Stack Tecnológica:** Frontend (React 19, Vite, TypeScript, Apollo Client v4.2.7, TailwindCSS v4) | Backend (NestJS, Prisma ORM, GraphQL, TypeScript, Supabase Auth).
* **Foco no MVP (YAGNI):** Funcionalidades fora do escopo primário (ex: áudio, IA, biometria) devem ser ignoradas ou tratadas como opcionais (`nullable`) no GraphQL para não bloquear o fluxo principal.
* **O Padrão "Terminal Burro" (SSOT):** O Frontend não calcula regras de negócio, limites diários ou filas de estudo. O NestJS/Prisma é a Única Fonte da Verdade. O React exibe dados e despacha eventos em complexidade O(1) (sempre lendo o topo da fila, index 0).
* **Defesa na Fronteira e Temporal:** O Backend não confia na telemetria do Frontend, aplicando grampos matemáticos (`Math.max(0, Math.min(ms, 60000))`) em logs de tempo. O Frontend aplica filtro secundário em milissegundos (`useMemo` no campo `due`) contra discrepâncias de timezone. Identidades de usuário são extraídas exclusivamente do JWT no Backend (prevenção de IDOR).
* **Purga de Memória (Tenant Isolation):** O fluxo de Logout exige obrigatoriamente a purga da memória RAM do navegador (`client.clearStore()`) de forma síncrona com a desconexão do Supabase, evitando vazamento cruzado de dados entre usuários na mesma máquina.

## 2. TypeScript Defensivo e Clean Code 🛡️
* **Tolerância Zero a `any` e `as`:** Proibido o uso de `any` ou coerções manuais (`as InterfaceCustomizada`). Exija Tipagem Estrutural (Duck Typing). Confie estritamente nos tipos gerados pelo GraphQL Codegen. Para subtipos, derive nativamente (ex: `type Item = NonNullable<Query['campo']>[number]`) em vez de inventar interfaces redundantes.
* **Proibição do Non-null Assertion (!):** É estritamente vetado forçar a nulidade com o operador `!`. Onde as "Regras dos Hooks" impedem o uso de Early Return, utilize fallback seguro (`param ?? ""`) combinado com proteção declarativa de rede (ex: `skip: !param`).
* **Segurança de Nulidade:** Omissões de dados utilizam estritamente `null` (domínio) em vez de `undefined`. Utilize Coalescência Nula (`??`) para fallbacks padrão (evitando operadores lógicos `||` que falham com `0` ou `false`) e Optional Chaining (`?.`) para acessos profundos.
* **Fallback na Desestruturação:** Valores padrão devem ser injetados na extração (ex: `const { flashcards = [] } = data ?? {}`), eliminando checagens manuais no JSX e prevenindo crashes em `.map()`.
* **Tratamento de Exceções:** Em blocos `catch(error)`, tipar como `unknown` e extrair dados via Type Guard (`if (error instanceof Error)`).
* **Checagem Exaustiva de Máquina de Estado:** `switch/case` avaliando Enums (ex: FSRS grades) deve possuir bloco `default` atribuindo o valor a uma variável do tipo `never`, forçando erro de compilação em estados não mapeados.

## 3. Padrões React 19 e Frontend ⚛️
* **Anti-pattern: Effect for Event Handling:** É expressamente proibido usar `useEffect` para "escutar" respostas de mutações (ex: sucesso, exibição de Toast, limpeza de formulário). Eventos do usuário devem ser resolvidos de forma síncrona e imperativa dentro do fluxo assíncrono que os originou (`try/catch/finally` no Event Handler).
* **Pureza do Componente (Lazy Init):** Funções impuras (`Date.now()`, `Math.random()`) são proibidas no render principal. Capture estados iniciais via Lazy Initialization (`useState(() => Date.now())`) ou `useRef`.
* **Telemetria Monotônica:** Para cálculos de duração ou latência, utilize estritamente `performance.now()` arredondado via `Math.round()`.
* **Derivação de Estado:** Proibido o uso de `useEffect` e `useState` para valores calculáveis sincronamente a partir de props ou outros estados.
* **O Padrão Bouncer (Early Returns):** Rejeite falhas e estados de carregamento no topo do componente lógico ou manipulador (`if (loading) return;`, `if (!deckId) return;`), mantendo a indentação linear.
* **Vite HMR e Contextos:** Arquivos `.tsx` exportam exclusivamente componentes. Contextos globais devem ser divididos na tríade: `Contexto.ts`, `Provider.tsx` e `Hook.ts`.
* **UI e TailwindCSS:** Layout restrito ao uso de Flexbox (CSS Grid proibido). Proibido uso de diálogos nativos (`alert()`, `confirm()`). Zero FOUC em rotas protegidas (exibir loading até a confirmação da sessão).
* **Eventos Nativos e Formulários:** Eventos de submissão de formulários devem utilizar estritamente a tipagem `React.SyntheticEvent<HTMLFormElement>`. O uso do antigo `FormEvent` é obsoleto e vetado.
* **Isolamento de Parsers:** O motor de leitura (`react-markdown` + `rehype-katex`) deve ser estritamente isolado em um componente próprio (`MarkdownRenderer`). É proibida a passagem genérica de propriedades HTML da UI diretamente para o motor.
* **Fim do `forwardRef`:** No React 19, a propriedade `ref` é tratada nativamente como uma prop normal. É proibido o uso do utilitário `forwardRef` para repassar referências a componentes.
* **Contenção de Falhas (Error Boundaries):** Isole componentes críticos e instáveis (como o motor de renderização de LaTeX) em *Error Boundaries*. Falhas de renderização em um subcomponente não devem derrubar a árvore inteira da aplicação.

## 4. Apollo Client v4.2.7 e GraphQL 🚀
* **Segregação de Imports:** Módulos de documento/cliente (`ApolloClient`, `InMemoryCache`, `gql`) vêm de `@apollo/client/core`. Hooks visuais (`useQuery`, `useMutation`) vêm de `@apollo/client/react`. Utilitários de link vêm de `@apollo/client/link/context`.
* **Middlewares e Contexto de Rede (Links):** Utilize a classe `SetContextLink` em vez da factory obsoleta `setContext`. Permita que o TypeScript infira a assinatura nativa de `prevContext` (como `Readonly<OperationContext>`) sem injetar tipagens customizadas. Aplique o *Duck Typing* estritamente no corpo da função (ex: `"headers" in prevContext`) para extrair dados dinâmicos com segurança.
* **Inferência Nativa:** Proibido injetar genéricos manuais nos hooks; utilize `TypedDocumentNode` gerado pelo Codegen. Utilize aliases ao desestruturar múltiplas consultas.
* **Colocação de Fragmentos (Fragment Colocation):** Componentes de UI devem declarar suas próprias dependências de dados isoladas via GraphQL Fragments. A Query principal deve apenas compor esses fragmentos, evitando o acoplamento de dados globais e prevenindo requisições desnecessárias.
* **Fim de Callbacks Deprecadas:** Proibido `onError` ou `onCompleted` nas opções de `useQuery`. Trate efeitos colaterais via `useEffect` escutando os estados reativos de `error` ou `data`.
* **Imutabilidade Estrita e Evicção de Cache:** Manipulações manuais de cache (`cache.modify`) devem tipar arrays como `readonly Reference[]` e utilizar métodos puros (`.filter()`, `.map()`), encontrando itens exclusivamente pelo identificador único (`id`), nunca por índice posicional. Extraia manipulações complexas de cache para Custom Hooks (SRP).

## 5. NestJS e Prisma ORM (Backend) ⚙️
* **Tipagem Nativa de Banco de Dados:** Entidades que representam UUIDs devem ser explicitamente instruídas para o motor do banco de dados (ex: `@db.Uuid` no PostgreSQL). Omissões silenciosamente tipam colunas como texto, destruindo a performance de indexação B-Tree.
* **Migrações Destrutivas Estruturais:** Ao alterar a tipagem primária de uma coluna já populada (ex: `text` para `uuid`), aborte a ação padrão de `DROP COLUMN` do Prisma. Gere a migração via CLI em branco (`prisma migrate dev --create-only`) e construa o Cast Nativo diretamente em SQL (ex: `ALTER COLUMN "id" TYPE UUID USING "id"::uuid;`).
* **Validação Code-First:** Campos opcionais no GraphQL exigem `@Field({ nullable: true })` e `@IsOptional()`. Campos obrigatórios em DTOs de entrada utilizam asserção de atribuição definida (`propriedade!: tipo;`).
* **Destruturação de Payload:** Desestruture parâmetros de entrada logo na assinatura do método ou na primeira linha do Resolver/Service.
* **Otimização de Consultas (Prisma):** Proibido overfetching com `include` genérico. Favoreça projeções estritas com `select`.
* **Prevenção do Problema N+1 (GraphQL):** É estritamente vetado resolver relacionamentos aninhados (ex: buscar `flashcards` dentro de um `deck`) de forma ingênua via `@ResolveField()` sem o uso estruturado de um *DataLoader*. Priorize a junção dos dados via `select` do Prisma no nível raiz da Query.
* **Transações Atômicas:** Criações dependentes (ex: Flashcard + estado FSRS inicial) devem ser executadas em uma única query aninhada (`create` relacional).

## 6. Anti-patterns Fatais e Boas Práticas 🚫
* **God Objects/Functions:** Classes ou funções com múltiplas responsabilidades (violação do SRP).
* **Renderização Condicional Suja:** Vazamento de zeros não-booleanos no JSX (ex: `cards.length && <Deck/>`). Exija sempre comparação explícita: `cards.length > 0 && <Deck/>` ou `!!cards.length && <Deck/>`.
* **Event Listeners e Stale Closures:** Mutações e listeners globais devem utilizar o padrão *Latest Ref* ou ser expurgados adequadamente no Cleanup do `useEffect` para evitar vazamentos de memória (Thrashing).