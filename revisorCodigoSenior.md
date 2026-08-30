# Base de Conhecimento Técnico: Revisão de Código Sênior

## 1. Escopo e Arquitetura Global (MVP - Fase 1) 🏗️

- **Stack Tecnológica:** Frontend (React 19, Vite, TypeScript, Apollo Client v4.2.7, TailwindCSS v4) | Backend (NestJS, Prisma ORM, GraphQL, TypeScript, Supabase Auth).
- **Foco no MVP (YAGNI):** Funcionalidades fora do escopo primário (ex: áudio, IA, biometria) devem ser ignoradas ou tratadas como opcionais (`nullable`) no GraphQL para não bloquear o fluxo principal.
- **O Padrão "Terminal Burro" (SSOT):** O Frontend não calcula regras de negócio, limites diários ou filas de estudo. O NestJS/Prisma é a Única Fonte da Verdade. O React exibe dados e despacha eventos em complexidade O(1) (sempre lendo o topo da fila, index 0).
- **Defesa na Fronteira e Temporal:** O Backend não confia na telemetria do Frontend, aplicando grampos matemáticos (`Math.max(0, Math.min(ms, 60000))`) em logs de tempo. O Frontend aplica filtro secundário em milissegundos (`useMemo` no campo `due`) contra discrepâncias de timezone. Identidades de usuário são extraídas exclusivamente do JWT no Backend (prevenção de IDOR).
- **Purga de Memória (Tenant Isolation):** O fluxo de Logout exige obrigatoriamente a purga da memória RAM do navegador (`client.clearStore()`) de forma síncrona com a desconexão do Supabase, evitando vazamento cruzado de dados entre usuários na mesma máquina.

## 2. TypeScript Defensivo e Clean Code 🛡️

- **Tolerância Zero a `any` e `as`:** Proibido o uso de `any` ou coerções manuais (`as InterfaceCustomizada`). Exija Tipagem Estrutural (Duck Typing). Confie estritamente nos tipos gerados pelo GraphQL Codegen. Para subtipos, derive nativamente (ex: `type Item = NonNullable<Query['campo']>[number]`) em vez de inventar interfaces redundantes.
- **Proibição do Non-null Assertion (!):** É estritamente vetado forçar a nulidade com o operador `!`. Onde as "Regras dos Hooks" impedem o uso de Early Return, utilize fallback seguro (`param ?? ""`) combinado com proteção declarativa de rede (ex: `skip: !param`).
- **Segurança de Nulidade:** Omissões de dados utilizam estritamente `null` (domínio) em vez de `undefined`. Utilize Coalescência Nula (`??`) para fallbacks padrão (evitando operadores lógicos `||` que falham com `0` ou `false`) e Optional Chaining (`?.`) para acessos profundos.
- **Fallback na Desestruturação:** Valores padrão devem ser injetados na extração (ex: `const { flashcards = [] } = data ?? {}`), eliminando checagens manuais no JSX e prevenindo crashes em `.map()`.
- **Tratamento de Exceções:** Em blocos `catch(error)`, tipar como `unknown` e extrair dados via Type Guard (`if (error instanceof Error)`).
- **Checagem Exaustiva de Máquina de Estado:** `switch/case` avaliando Enums (ex: FSRS grades) deve possuir bloco `default` atribuindo o valor a uma variável do tipo `never`, forçando erro de compilação em estados não mapeados.
- **Tipagem Estrita em Formulários (Uncontrolled Components):** É proibida a coerção de tipos via `as string` ao extrair dados de `FormData`. Utilize construtores nativos do JavaScript combinados com coalescência nula para garantir a segurança em runtime e tipagem inferida: `const valor = parseInt(String(formData.get("campo") ?? "0"), 10);`.
- **Type Guards de Variáveis de Ambiente (Fail-Fast):** Ao consumir `import.meta.env` (Frontend) ou `process.env` (Backend), é obrigatório validar a tipagem e existência da variável imediatamente. Dispare um erro fatal (`throw new Error(...)`) caso a chave não seja uma `string` válida. Nunca injete variáveis de ambiente silenciosamente nulas em instâncias de clientes (ex: Supabase, Apollo).
- **Validação Pura (Early-Fail):** Extraia regras de validação de formulário para funções puras e agnósticas ao React (ex: `validateInput(a, b): string | null`). Invoque essa função como a primeira instrução (_Padrão Bouncer_) do manipulador de evento, abortando a requisição e emitindo feedback visual localmente sem onerar a rede.
- **Centralização de Regras de Domínio (Prevenção de Falsos Positivos e DRY):** Funções de validação pura (ex: `validateInput`) não devem ser tratadas como utilitários privados de um componente (Silos de Conhecimento). Aloque-as obrigatoriamente em um diretório de negócio (`domain/` ou `utils/`) para garantir que as interfaces de Criação e Edição da mesma entidade consumam a exata mesma "verdade matemática" de integridade, bloqueando o tráfego de dados adulterados na edição.

## 3. Padrões React 19 e Frontend ⚛️

- **Anti-pattern: Effect for Event Handling:** É expressamente proibido usar `useEffect` para "escutar" respostas de mutações (ex: sucesso, exibição de Toast, limpeza de formulário). Eventos do usuário devem ser resolvidos de forma síncrona e imperativa dentro do fluxo assíncrono que os originou (`try/catch/finally` no Event Handler).
- **Pureza do Componente (Lazy Init):** Funções impuras (`Date.now()`, `Math.random()`) são proibidas no render principal. Capture estados iniciais via Lazy Initialization (`useState(() => Date.now())`) ou `useRef`.
- **Telemetria Monotônica:** Para cálculos de duração ou latência, utilize estritamente `performance.now()` arredondado via `Math.round()`.
- **Derivação de Estado:** Proibido o uso de `useEffect` e `useState` para valores calculáveis sincronamente a partir de props ou outros estados.
- **O Padrão Bouncer (Early Returns):** Rejeite falhas e estados de carregamento no topo do componente lógico ou manipulador (`if (loading) return;`, `if (!deckId) return;`), mantendo a indentação linear.
- **Vite HMR e Contextos:** Arquivos `.tsx` exportam exclusivamente componentes. Contextos globais devem ser divididos na tríade: `Contexto.ts`, `Provider.tsx` e `Hook.ts`.
- **UI e TailwindCSS:** Layout restrito ao uso de Flexbox (CSS Grid proibido). Proibido uso de diálogos nativos (`alert()`, `confirm()`). Zero FOUC em rotas protegidas (exibir loading até a confirmação da sessão).
- **Eventos Nativos e Formulários:** Eventos de submissão de formulários devem utilizar estritamente a tipagem `React.SyntheticEvent<HTMLFormElement>`. O uso do antigo `FormEvent` é obsoleto e vetado.
- **Isolamento de Parsers:** O motor de leitura (`react-markdown` + `rehype-katex`) deve ser estritamente isolado em um componente próprio (`MarkdownRenderer`). É proibida a passagem genérica de propriedades HTML da UI diretamente para o motor.
- **Fim do `forwardRef`:** No React 19, a propriedade `ref` é tratada nativamente como uma prop normal. É proibido o uso do utilitário `forwardRef` para repassar referências a componentes.
- **Contenção de Falhas (Error Boundaries):** Isole componentes críticos e instáveis (como o motor de renderização de LaTeX) em _Error Boundaries_. Falhas de renderização em um subcomponente não devem derrubar a árvore inteira da aplicação.
- **Harmonia Visual e Contenção de Contraste (UI02):** Respeite rigorosamente a herança de cores dos contêineres de ancoragem estática. Se um elemento fixo (ex: Header) exige modo claro, o invólucro pai (`MainLayout`) é proibido de forçar um modo escuro global, prevenindo fadiga ocular por contraste abrupto. Isole o "Modo Imersivo" (Dark Mode profundo) apenas em rotas exclusivas de foco que não herdem a navegação padrão.
- **Paginação Client-Side (Fallback de MVP):** Caso o schema do Backend ainda não suporte argumentos de paginação (`limit`/`offset`) em determinado nó, não sobrecarregue a _thread_ do React renderizando milhares de nós no DOM. Implemente paginação em memória, recebendo o array completo via rede, mas fatiando sua exibição localmente em complexidade O(1) (`array.slice(0, visibleCount)`).
- **Ciclo de Vida de Modais (Tear-down Estrito):** É estritamente proibido renderizar modais ocultos via CSS ou fazer o componente do modal retornar `null` internamente. Oculte modais **desmontando-os condicionalmente na árvore do componente pai** (ex: `{isOpen && <Modal />}`). Isso garante que o estado interno do modal (formulários, _steps_ de edição) seja sumariamente destruído e resetado a cada nova abertura.
- **Navegação Assíncrona e Unmount:** É vetado invocar setters de estado (`setState(false)`) após acionar funções que desmontem o componente atual (como `navigate()` do React Router). Execute as rotinas de limpeza ou desative os _flags_ de _loading_ estritamente **antes** do roteamento, prevenindo alertas de _Memory Leak_ no React.
- **Responsividade Mobile-First:** Ao arquitetar layouts com TailwindCSS e Flexbox, escreva as marcações assumindo a tela de um smartphone como base e escale para desktop utilizando prefixos de _breakpoint_ (ex: `flex-col md:flex-row`). É proibido assumir o desktop como _viewport_ padrão.
- **Compatibilidade Fast Refresh (Vite HMR):** Para garantir a reatividade instantânea no desenvolvimento, arquivos visuais (`.tsx`) devem exportar estritamente o Componente React principal. É proibido exportar interfaces, tipos complexos ou fragmentos GraphQL secundários no mesmo arquivo da UI. Aloque tipos e validações em diretórios próprios ou mantenha-os privados (sem export) ao arquivo.
- **Estabilidade de Dependências (React Compiler):** É estritamente proibido o uso de expressões computadas ou Optional Chaining (ex: `data?.deck`) em arrays de dependências de hooks (`useEffect`, `useCallback`). O compilador falha ao rastrear e memoizar expressões dinâmicas. Extraia a referência para uma constante estabilizada (`const deck = data?.deck ?? null;`) e utilize-a univocamente no corpo da função e no array de dependências.

## 4. Apollo Client v4.2.7 e GraphQL 🚀

- **Segregação de Imports:** Módulos de documento/cliente (`ApolloClient`, `InMemoryCache`, `gql`) vêm de `@apollo/client/core`. Hooks visuais (`useQuery`, `useMutation`) vêm de `@apollo/client/react`. Utilitários de link vêm de `@apollo/client/link/context`.
- **Middlewares e Contexto de Rede (Links):** Utilize a classe `SetContextLink` em vez da factory obsoleta `setContext`. Permita que o TypeScript infira a assinatura nativa de `prevContext` (como `Readonly<OperationContext>`) sem injetar tipagens customizadas. Aplique o _Duck Typing_ estritamente no corpo da função (ex: `"headers" in prevContext`) para extrair dados dinâmicos com segurança.
- **Inferência Nativa:** Proibido injetar genéricos manuais nos hooks; utilize `TypedDocumentNode` gerado pelo Codegen. Utilize aliases ao desestruturar múltiplas consultas.
- **Colocação de Fragmentos (Fragment Colocation):** Componentes de UI devem declarar suas próprias dependências de dados isoladas via GraphQL Fragments. A Query principal deve apenas compor esses fragmentos, evitando o acoplamento de dados globais e prevenindo requisições desnecessárias.
- **Fim de Callbacks Deprecadas:** Proibido `onError` ou `onCompleted` nas opções de `useQuery`. Trate efeitos colaterais via `useEffect` escutando os estados reativos de `error` ou `data`.
- **Imutabilidade Estrita e Evicção de Cache:** Manipulações manuais de cache (`cache.modify`) devem tipar arrays como `readonly Reference[]` e utilizar métodos puros (`.filter()`, `.map()`), encontrando itens exclusivamente pelo identificador único (`id`), nunca por índice posicional. Extraia manipulações complexas de cache para Custom Hooks (SRP).
- **Fronteira de Autogeração (A Regra de Ouro do Codegen):** O Frontend deve espelhar estritamente o _Schema_ GraphQL suportado pelo Backend. É estritamente proibido injetar argumentos (como `$limit`) em _queries_ se eles não existirem na API, sob pena de quebrar o _Abstract Syntax Tree (AST)_ e rebaixar silenciosamente as consultas para `unknown` ou `any`. Sempre assuma a necessidade de rodar o gerador (`npm run generate`) ao alterar ou criar consultas.
- **Isolamento de Linters em Artefatos (ESLint Flat Config):** Ferramentas de geração de código (como Codegen e Prisma) quebram regras de "Código Limpo" (ex: uso interno de `any`) por design. É proibido tentar refatorar ou tipar manualmente arquivos gerados (ex: `gql.ts`). Suprima a auditoria do _linter_ sobre esses diretórios diretamente na configuração raiz (ex: `ignores: ["src/gql/**/*"]`), mantendo a Tolerância Zero exclusiva para o código autoral.
- **Reatividade vs. Stale Cache (SSOT):** O cache normalizado do Apollo é a Única Fonte da Verdade na interface. Ao realizar mutações destrutivas (ex: `cache.evict`), atualize os contadores da UI derivando-os diretamente do array em memória (`array.length`). É proibido depender de campos estáticos do banco (ex: `_count.relacionamento`) quando a coleção real estiver em cache, evitando dessincronia visual (Stale Cache) entre listas e contadores.
- **Políticas de Merge Paginado:** Ao implementar paginação real (Server-side) em coleções, a substituição padrão do Apollo (`return incoming`) é fatal. Configure explicitamente a `TypePolicy` no cache desativando a separação de chaves (`keyArgs: false`) e escrevendo uma função `merge` que deduplique nós iterando sobre o `readField("id")`, garantindo acúmulo contínuo e seguro na rolagem.
- **Verificação Prévia de Schema (Schema-First Sync):** O Frontend é escravo do contrato do Backend. Antes de injetar parâmetros arbitrários (como paginação `$limit` / `$offset` ou filtros) em uma Query GraphQL, é obrigatório verificar se o _Schema_ atual da fase do projeto suporta essa injeção. Presumir argumentos inexistentes destrói o _Abstract Syntax Tree (AST)_ do Codegen.
- **Coleta de Lixo Manual (Garbage Collection):** Sempre que utilizar a API de mutação de cache `cache.evict({ id })` para remover um nó, é obrigatório invocar o expurgo em seguida utilizando `cache.gc()`. Isso purga fisicamente as referências órfãs da memória RAM do cliente (Dangling References), estabilizando a performance em sessões longas.

## 5. NestJS e Prisma ORM (Backend) ⚙️

- **Tipagem Nativa de Banco de Dados:** Entidades que representam UUIDs devem ser explicitamente instruídas para o motor do banco de dados (ex: `@db.Uuid` no PostgreSQL). Omissões silenciosamente tipam colunas como texto, destruindo a performance de indexação B-Tree.
- **Migrações Destrutivas Estruturais:** Ao alterar a tipagem primária de uma coluna já populada (ex: `text` para `uuid`), aborte a ação padrão de `DROP COLUMN` do Prisma. Gere a migração via CLI em branco (`prisma migrate dev --create-only`) e construa o Cast Nativo diretamente em SQL (ex: `ALTER COLUMN "id" TYPE UUID USING "id"::uuid;`).
- **Validação Code-First:** Campos opcionais no GraphQL exigem `@Field({ nullable: true })` e `@IsOptional()`. Campos obrigatórios em DTOs de entrada utilizam asserção de atribuição definida (`propriedade!: tipo;`).
- **Destruturação de Payload:** Desestruture parâmetros de entrada logo na assinatura do método ou na primeira linha do Resolver/Service.
- **Otimização de Consultas (Prisma):** Proibido overfetching com `include` genérico. Favoreça projeções estritas com `select`.
- **Prevenção do Problema N+1 (GraphQL):** É estritamente vetado resolver relacionamentos aninhados (ex: buscar `flashcards` dentro de um `deck`) de forma ingênua via `@ResolveField()` sem o uso estruturado de um _DataLoader_. Priorize a junção dos dados via `select` do Prisma no nível raiz da Query.
- **Transações Atômicas:** Criações dependentes (ex: Flashcard + estado FSRS inicial) devem ser executadas em uma única query aninhada (`create` relacional).

## 6. Anti-patterns Fatais e Boas Práticas 🚫

- **God Objects/Functions:** Classes ou funções com múltiplas responsabilidades (violação do SRP).
- **Renderização Condicional Suja:** Vazamento de zeros não-booleanos no JSX (ex: `cards.length && <Deck/>`). Exija sempre comparação explícita: `cards.length > 0 && <Deck/>` ou `!!cards.length && <Deck/>`.
- **Event Listeners e Stale Closures:** Mutações e listeners globais devem utilizar o padrão _Latest Ref_ ou ser expurgados adequadamente no Cleanup do `useEffect` para evitar vazamentos de memória (Thrashing).
- **Condicionais Redundantes no JSX (Early Return e Arrays):** É estritamente proibido envelopar componentes na árvore principal com chaves booleanas redundantes se a nulidade do dado já foi interceptada. Se uma variável superou o Padrão Bouncer (ex: `if (!data) return <Fallback/>;`), não utilize `{data && <Component/>}` no JSX subsequente. Adicionalmente, matrizes (`Arrays`) vazias são sempre avaliadas como `truthy` em JavaScript; evite falsas guardas como `{lista && <List data={lista}/>}`. A responsabilidade visual do "estado vazio" (_empty state_) pertence exclusivamente ao subcomponente.

## 7. Roteamento e Composição de Interface (UI Architecture) 🧩

- **Validação Declarativa de Parâmetros (Route Guards):** É estritamente proibido realizar a validação higiênica de parâmetros dinâmicos de URL (ex: `deckId`) dentro do corpo do componente visual da página. Delegue essa responsabilidade para componentes _Wrapper_ interceptadores na camada de roteamento (ex: `<RequireParam />` envelopando o `<Outlet />`). Isso aborta a montagem de telas e a alocação pesada de _Hooks_ antes mesmo de a página tentar renderizar com dados malformados.
- **Orquestradores vs. Dumb Components (Fim dos God Objects Visuais):** Componentes de Página (`pages/`) são exclusivamente **Orquestradores de Estado**. A função deles é invocar _Hooks_ de dados (GraphQL/Apollo) e injetar propriedades (_props_). Se um arquivo de página acumular múltiplos blocos lógicos de interface (ex: _Headers_, Listagens e Painéis de Estatísticas gerando +200 linhas de JSX), obrigatoriamente fragmente-o em subcomponentes puros (_Dumb Components_) no diretório `components/`.

## 8. Estabilidade do React e Event Loop 🔄

- **Estabilidade Referencial de Propriedades (Prevenção de Thrashing):** É proibido repassar funções anônimas literais (ex: `onClose={() => setOpen(false)}`) para subcomponentes que gerenciam ciclo de vida próprio e _Event Listeners_ (como Modais rastreando a tecla `Escape`). O React recria essas funções a cada _render_, forçando os filhos a atirarem gatilhos destrutivos de montagem/desmontagem de eventos do DOM de forma cíclica e inútil (_Thrashing_). Oblitere essa falha estabilizando a referência com o hook `useCallback` no componente pai.

## 9. Operações Otimistas e Zero-Overfetching (Apollo Avançado) 🕸️

- **Inserção Otimista em Memória O(1):** Após executar uma mutação de criação (`CREATE`), é vetado utilizar `refetchQueries` para atualizar listas volumosas. Utilize `cache.modify` na entidade pai para extrair a nova referência via `toReference` e anexá-la imutavelmente ao array existente. Preserve a franquia de rede e os recursos do servidor (Zero Overfetching).
- **Proibição de Requisições Compensatórias pós-Deleção:** Se uma entidade for higienizada e fisicamente extirpada do cache via `cache.modify` (remoção da lista pai) combinado com `cache.evict` e `cache.gc()`, é terminantemente proibido disparar requisições de rede compensatórias para a mesma coleção. Confie na reatividade do _Normalized Cache_ do Apollo como a Única Fonte da Verdade (SSOT); a interface refletirá a deleção instantaneamente em 0ms.

## 10. Resoluções de Conflito de Análise Estática (React Compiler e Linter) 🤖

- **Isolamento de Expressões em Dependências (Exhaustive Deps):** É estritamente proibido criar variáveis derivadas usando expressões lógicas ou fallbacks (ex: `const lista = data?.lista ?? null`) no escopo do _render_ para em seguida passá-las como dependência de um `useMemo` ou `useCallback`. O _linter_ analisará o código estaticamente e acusará mutação a cada render, independentemente da estabilidade real na memória.
- **Resolução de Fallbacks (In-Callback Guard):** Fallbacks de nulidade e coalescências (ex: `?? []`) devem ser aplicados **exclusivamente dentro do escopo interno** da função de callback do _hook_ memoizado.
- **Assinatura de Propriedade Nativa:** O array de dependências deve assinar estritamente a propriedade de origem, garantida e estabilizada pela biblioteca cliente (ex: dependa de `[data?.myDecks]` e não de variáveis intermediárias desestruturadas).

## 11. Limites do Vite HMR (Hot Module Replacement) ⚡

- **Fronteira Estrita de Exportação Visual:** Para preservar o estado reativo da interface durante o desenvolvimento (Fast Refresh), arquivos terminados em `.tsx` devem exportar estritamente o Componente React primário (Anotação de UI).
- **Vazamento de Tipos:** A exportação mista de tipos de dados (`type`, `interface`) e Enums no mesmo arquivo do componente visual aborta a injeção a quente do Vite e obriga um _Full Page Reload_. Remova tipagens expostas de `.tsx` e encapsule-as em arquivos `.ts` puramente lógicos.

## 12. Gestão Defensiva do Apollo Client e Infinite Scroll 📚

- **A Falácia do "return incoming" em Coleções:** Em requisições de coleções no `InMemoryCache`, a instrução `return incoming` apaga sumariamente a memória anterior em fluxos de paginação (Stale Cache Destrutivo). É obrigatório utilizar a diretriz `keyArgs: false` combinada com uma função de merge personalizada.
- **Merge de Deduplicação Custo O(1):** Ao concatenar dados do cache em paginações infinitas, a função `merge` deve deduplicar nós para prevenir falhas de chave no React. É proibido usar `array.includes()` ou `.find()`. Crie um `new Set()` baseado em `readField('id')` para garantir validações instantâneas de alta performance.
- **Prevenção do Padrão "Silo de Conhecimento" (SSOT):** Nunca replique validações universais de formulário dentro de componentes modais (`CreateDeckModal`, `EditFlashcardModal`). As funções de checagem devem sempre ser importadas de um diretório central (`domain/validators.ts`), garantindo a preservação do _Don't Repeat Yourself_ (DRY).

## 13. Orquestração Visual e Inversão de Controle (IoC) 🎨

- **Inversão de Controle em Componentes Genéricos (Agnostic Wrappers):** Componentes de infraestrutura visual ou motores de leitura (ex: renderizadores de Markdown/LaTeX) não devem definir suas próprias classes de cor absolutas (ex: `text-white` hardcoded). Para respeitar a regra de Harmonia Visual (UI02), o componente deve receber o tema estritamente por herança via prop `className`, transferindo a responsabilidade do contraste para os orquestradores pai (evitando invisibilidade de conteúdo em trocas de _Dark/Light Mode_).
- **Fim das Flags de Bloqueio em Mutações Otimistas (YAGNI):** É proibido o uso de variáveis de estado locais (ex: `isSubmitting`, `disabled={loading}`) para bloquear interações de interface caso a requisição assíncrona esteja protegida por uma estratégia de _Optimistic UI_ no Apollo Client. Se o nó será substituído na árvore virtual em 0ms, bloqueios na _thread_ principal geram código morto, sujam o componente e quebram a fluidez (_Cognitive Flow_) preconizada no Modelo de Fogg (UI04).

## 14. Performance de Renderização e Ciclo de Efeitos ⚙️

- **Erradicação de Renderizações em Cascata (Cascading Renders):** É estritamente vetado o uso de hooks `useEffect` para alterar o estado visual da interface (ex: `setIsFlipped(false)`) como consequência direta de uma interação prévia do usuário. O reajuste visual deve ocorrer imperativamente na mesma função manipuladora de evento (ex: `handleRating`) que deflagra a chamada ao Backend. Alterar estados dentro de efeitos gera re-renderizações duplas punitivas na arquitetura do React 19.
- **Estabilização Primitiva de Dependências em Hooks:** Ao memorizar funções ou engatilhar efeitos baseados em respostas complexas de GraphQL (Objetos ou Nós), é proibido repassar a referência inteira do objeto ou avaliações de curto-circuito (`objeto?.id`) para o array de dependências. Extraia estritamente o identificador primitivo para uma constante separada (`const id = objeto?.id`) e assine-a como dependência. Isso pacifica o _linter_ estático e previne falsos re-renders e Encapsulamentos Obsoletos (_Stale Closures_).
- **Performance de Renderização:** A extração e rastreamento exclusivo de valores primitivos na árvore de dependências pacifica a análise estática e previne ativamente o efeito colateral de encasulamentos obsoletos (stale closures)[cite: 1, 2].

## 15. Regras Específicas do Domínio FSRS (Motor de Estudos) 🧠

- **Prevenção de Envenenamento de Dataset (Regra RN02):** A edição de qualquer conteúdo atômico (_Frente/Verso_) de um flashcard que já possua logs de retenção deve obrigatoriamente questionar o usuário via interface antes da submissão. A UI deve enviar um sinalizador explícito (booleano) informando se a edição tratou-se de uma falha de digitação ou de uma alteração estrutural de contexto. Apenas sob essa confirmação explícita o backend destruirá as variáveis estocásticas (`Stability/Difficulty`) para evitar corromper o treinamento da rede neural.
- **Operação _Zero-Latency_ e UX Baseada em Teclado (UI04):** Telas de alto volume cognitivo de repetição devem ser estruturadas garantindo navegação absoluta por _Hardware/Shortcuts_ (ex: Espaço/Enter para flip, Numéricos para Rating), sem bloqueios (debounces visuais locais). A telemetria de latência deve ocorrer de forma invisível pelo _useRef_ e o envio ao _backend_ jamais deve punir a interação subsequente.

## 16. UX Defensiva e Feedback de Interface (Anti-Silent Fail) 🚨

- **Feedback Obrigatório no Padrão Bouncer:** É terminantemente proibido utilizar `return;` vazio ao interceptar erros induzidos pelo usuário (ex: validação de formulários). Todo _Early-Fail_ que bloqueia uma submissão deve obrigatoriamente acionar a camada de notificação (ex: `showToast("Motivo do erro", "error")`). Omitir o feedback gera Falhas Silenciosas (_Silent Fails_) e destrói a Visibilidade do Estado do Sistema (Heurística de Nielsen).
- **Bloqueio Físico vs. Optimistic UI:** Diferencie a natureza das requisições. Mutações externas (ex: Login, Integração de Pagamento) EXIGEM bloqueio físico de interface (`disabled={loading}`) para prevenir duplo envio. Mutações internas de domínio (ex: Rating de Estudo, Marcar como Lido) EXIGEM _Optimistic UI_ e PROÍBEM o uso de estados de `loading` no DOM, garantindo latência zero.
- **Tratamento de Rollback Otimista:** Em blocos `catch` de mutações otimistas, o Frontend deve informar explicitamente ao usuário que a ação instantânea falhou e foi revertida (ex: _"Erro de rede. O progresso falhou e o cartão retornou à fila"_).

## 17. Segurança de Rede e Backend (NestJS) 🧱

- **Filtros Globais de Exceção (Data Masking):** O Backend é proibido de vazar códigos de erro nativos do banco de dados (ex: `PrismaClientKnownRequestError` com código `P2002`) para o Frontend GraphQL. Utilize `Exception Filters` no NestJS para mascarar erros de banco em mensagens de domínio tratadas (ex: _"Este e-mail já está em uso"_).
- **Sanitização Estrita de DTOs (Mass Assignment):** Todo DTO de entrada deve ser protegido pelo `ValidationPipe` do NestJS com as propriedades `whitelist: true` e `forbidNonWhitelisted: true`. O sistema deve rejeitar automaticamente qualquer payload que envie propriedades não mapeadas, prevenindo ataques de poluição de objetos ou escalada de privilégios.
- **Isolamento de Rate Limiting:** Rotas públicas não autenticadas (como `/login`, `/signup`, `/forgot-password`) devem obrigatoriamente implementar _Throttling_ (Rate Limit) no NestJS para prevenir ataques de força bruta e esgotamento de recursos do Supabase.

## 18. Acessibilidade (a11y) e Navegação por Teclado ♿

- **Contenção de Eventos de Teclado (Scroll Jump):** Ao mapear atalhos de teclado (ex: `Espaço` para virar o cartão no FSRS), é obrigatório invocar `e.preventDefault()` na captura do evento. Isso impede o comportamento nativo do navegador (como o _Page Down_ gerado pela barra de espaço), que destrói o alinhamento visual durante a sessão de estudo.
- **Focus Trap em Modais:** Modais de sobreposição (ex: Edição, Criação) devem prender o foco do teclado internamente enquanto estiverem abertos. Quando desmontados, o foco deve retornar ao elemento que os invocou, garantindo a navegação fluida sem o uso do mouse.

## 19. Otimização de Contextos React (Evitando Re-renders em Cascata) 🏎️

- **Memoização do Value em Providers:** É proibido passar objetos literais diretamente para a propriedade `value` de Context Providers (ex: `<AuthContext.Provider value={{ user, loading }}>`). Isso recria a referência do objeto a cada render do pai, forçando a re-renderização de toda a árvore de componentes filhos. O valor deve ser obrigatoriamente estabilizado com `useMemo`.
- **Otimização de Contextos React:** A memoização de instâncias em AuthProvider e ToastProvider bloqueia vazamentos de processamento e erradica re-renderizações destrutivas em cascata na árvore de filhos[cite: 1, 2].

## 20. Padrões de Módulo e Compatibilidade de HMR 📦

- **Named Exports Estritos (Fim do `export default`):** É terminantemente proibido utilizar `export default` na declaração de componentes, hooks ou utilitários. Esta prática sabota o mapeamento refatorado da IDE (TypeScript Server), confunde o grafo de dependências do Vite HMR (Fast Refresh) e abre brechas para renomeações ambíguas em imports. Utilize exclusivamente _Named Exports_ (ex: `export const App = () => ...` ou `export function App() { ... }`).

## 21. Otimização Avançada de GraphQL e Cache (Zero-Overfetching) 🗃️

- **Contadores Derivados via TypePolicy (Interceptação de Aggregate):** Ao exibir contadores de relações (ex: quantidade de cartões em um baralho), é proibido buscar a coleção aninhada (ex: `flashcards { id }`) apenas para aferir o comprimento (`.length`). Solicite sempre o agregador estático ao banco (ex: `_count { flashcards }`).
- **Sincronização Ativa de Agregadores:** Para evitar dessincronia visual quando novos itens forem adicionados ao cache, intercepte o campo `_count` no `InMemoryCache` através de uma `read` function. Se a matriz física já estiver na memória do cliente (`Array.isArray(readField('colecao'))`), o Apollo deve derivar o `.length` localmente, substituindo o contador do banco. Se não estiver, retorna o valor estático pré-calculado pelo backend.
- **Zero-Overfetching no Apollo Client:** A interceptação ativa de agregações via TypePolicy e \_count preserva a franquia de rede ao derivar a contagem de entidades nativamente no cliente, rejeitando buscas estruturais desnecessárias no banco de dados[cite: 1, 2].

## 22. Developer Experience (DX) e Ferramental Contínuo 🛠️

- **Schema Watcher (Continuous DX):** Projetos baseados em contratos estritos (`graphql-codegen`) devem prever comandos de vigilância contínua no `package.json` (ex: `"generate:watch": "graphql-codegen -w"`). A inteligência da interface depende da recriação em tempo real da _Abstract Syntax Tree_ (AST) para evitar falsos positivos de _TypeScript_ ao acoplar novos recursos do Backend.
- **Ergonomia do AST Automático em Componentes Visuais:** Ao criar componentes modais focados na experiência do desenvolvedor/curador (ex: um _Preview_ de Markdown antes da gravação no banco), separe sempre as _Tabs_ usando puramente o Flexbox para alternância de visualização (`display: flex` contra `display: none` ou montagem condicional simples `!isPreviewMode ? <Editor/> : <Preview/>`), mantendo o peso de processamento amarrado a um único componente de formulário lógico.
- **Developer Experience:** A integração do vigilante generate:watch assegura a integridade ininterrupta da Abstract Syntax Tree (AST), fornecendo validações determinísticas de tipagem (Continuous DX) durante iterações na camada do backend[cite: 1, 2].

## 23. Resiliência de Ecossistema e Contenção de Falhas (Fail-Safe) 🛡️

- **Avaliação Tardia (Lazy Evaluation) de Ambiente:** É expressamente proibido disparar exceções (`throw new Error`) durante validações de `import.meta.env` ou `process.env` no escopo raiz do módulo (Module Initialization Scope). Envelopar validações críticas de infraestrutura (como URLs de API) em callbacks (ex: `() => getApiUrl()`). O colapso na raiz do módulo paralisa o navegador e bypassa a árvore do React; a avaliação tardia garante que o erro exploda no momento do render, acionando o `GlobalErrorBoundary` adequadamente.
- **Degradação Graciosa de Storage (Graceful Degradation):** Nunca acesse a API `window.localStorage` ou `sessionStorage` de forma direta e síncrona em inicializadores de clientes (ex: Supabase Auth). Abas anônimas e políticas rígidas de bloqueio de cookies lançam `DOMException` de acesso negado que causam crash instantâneo na aplicação. Obrigatório envelopar o acesso em adaptadores com blocos `try/catch` que possuam um fallback transparente para a memória RAM (ex: `new Map()`).

## 24. Prevenção a Armadilhas de Ferramental e Compilação ⚙️

- **Tolerância Zero a Auto-Imports Obsoletos (CJS vs ESM):** Em ecossistemas modernos (Vite, módulos ES nativos), é terminantemente proibida a injeção de dependências compiladas (CommonJS) originadas de auto-imports descuidados da IDE (ex: importar de `@apollo/client/react/react.cjs`). Exija importações limpas dos caminhos oficiais. Vazamentos ESM/CJS duplicam instâncias de bibliotecas na memória e quebram provedores de contexto silenciosamente.
- **Fim do Código Morto em Contratos Visuais (Dead Code Elimination):** As interfaces (interface Props) dos componentes React atuam como contratos jurídicos da arquitetura. É estritamente proibido definir propriedades "fantasmas" (ex: `onSuccess?: () => void`) que são declaradas, mas jamais extraídas ou invocadas no escopo lógico do componente. Aplique a regra YAGNI (You Aren't Gonna Need It) no nível de tipagem.

## 25. Segmentação Arquitetural e Herança Visual (UI & UX Avançada) 🧩

- **Abolição Completa de God Components:** O conceito de SRP (Single Responsibility Principle) se aplica ao tamanho físico e cognitivo dos arquivos. Se um Orquestrador (Página ou Modal Mestre) agregar instâncias de múltiplos domínios de negócio (ex: Autenticação + Regras FSRS + Exclusão LGPD), a marcação interna e a invocação de hooks devem ser obrigatoriamente pulverizadas em um subdiretório coeso (ex: `components/settings/`). O arquivo mestre atua estritamente como despachante de requisições (Queries) e provedor genérico de propriedades.
- **Microcopy Preventivo (Indução à Ação Segura):** Aplique microcopies responsivos atrelados à validação condicional em tempo real de metadados críticos. Se a API detecta divergências no ambiente (ex: o Fuso Horário salvo no banco diverge do `Intl.DateTimeFormat()` do navegador), injete mensagens textuais de alerta na interface obrigando a revisão do dado antes que fluxos automatizados (ex: motor de Rollover da madrugada) falhem silenciosamente na máquina do cliente.
- **Herança Estrita de Tema Base:** Se um componente estático de ancoragem (ex: `<Header/>`) for desenhado em Light Mode absoluto por restrição de UI, o container mestre (`<MainLayout/>`) que envelopa o restante da aplicação jamais deverá forçar esse mesmo modo (`bg-slate-50`) aos filhos. O `<MainLayout/>` deve implementar a cor de fundo do escopo profundo pretendido pela aplicação (`bg-slate-950`), obrigando os componentes de rota internos a tratarem o próprio contraste reativamente, evitando colapsos visuais.

## 26. Auditoria Visual em Cascata (Subtree Audit) 🎨

- **Sincronia Temática Obrigatória:** Ao receber comandos para alterar o alicerce temático de um _Wrapper_ ou contêiner de rota principal (ex: forçar o `MainLayout` para Dark Mode com `bg-slate-950`), é terminantemente proibido ignorar os nós filhos. Você deve realizar uma auditoria recursiva em todos os subcomponentes renderizados por aquela árvore (ex: cartões de estatísticas, listas) e erradicar as classes utilitárias que colidam com a nova paleta imposta (removendo `bg-white`, `bg-slate-50`, `text-slate-800` e aplicando equivalentes de alto contraste como `bg-slate-900`, `text-slate-100`). Deixar ilhas brancas em fundos escuros destrói a acessibilidade.

## 27. Defesa em Interceptadores Assíncronos (Network Links Fail-Safe) 🌐

- **Proibição de Crash em Midlewares (Apollo Link):** Em interceptadores de rede assíncronos (como o `SetContextLink` buscando sessões do Supabase), se a operação assíncrona lançar uma exceção de ambiente ou de I/O, o bloco `catch` **não pode** retornar vazio ou apenas efetuar log. Ele deve obrigatoriamente fornecer o _fallback_ contratual esperado pelo fluxo de rede (ex: `return { headers: fallbackHeaders };`). Permitir que o erro propague para fora do interceptador derruba a execução do cliente GraphQL inteiro, inviabilizando a captura pelo _Error Boundary_ do React.

## 28. Comportamento de Wrappers no Roteamento React 🔄

- **Responsabilidade Estática do Layout:** Lembre-se que componentes de _Layout_ (que renderizam `<Outlet />` no React Router) não sofrem re-renderizações automáticas quando a sub-rota troca de página, a menos que consumam estados globais afetados. É inútil injetar tipagens ou propriedades de domínio diretamente nestes _Wrappers_ visando alterar subcomponentes. Componentes estáticos de ancoragem (como um `<Header/>` dentro do `<MainLayout/>`) devem consumir suas próprias dependências via Contexto ou Cache Global (Apollo) de forma autônoma.

## 29. Infraestrutura de Workspace e Monorepos (VS Code) 📁

- **Topologia de Ponto Único (SSOT da IDE):** É estritamente proibido fragmentar configurações de IDE em subdiretórios (ex: .vscode/ aninhado dentro de frontend/ e backend/). O VS Code ignora configurações aninhadas ao abrir a raiz. Centralize settings.json e extensions.json na raiz absoluta do Monorepo.
- **Mapeamento de Servidores de Linguagem (LSP):** Em estruturas Monorepo, o ESLint e o TypeScript Server não adivinham a localização dos projetos. É obrigatório declarar caminhos explícitos no settings da raiz (ex: "eslint.workingDirectories": ["./frontend", "./backend"]) para não quebrar a auto-formatação e a análise estática silenciosamente.

## 30. Orquestração de Linters vs. Formatters ⚖️

- **Segregação Estrita de Responsabilidades:** Nunca confunda análise lógica com formatação estética. O ESLint atua estritamente como revisor lógico e caçador de bugs (regras de hooks, variáveis órfãs). O Prettier atua exclusivamente como formatador estético (indentação, espaçamento).
- **Prevenção de Colisão no Auto-Save:** No settings.json, defina obrigatoriamente um formatador padrão para a linguagem (ex: "editor.defaultFormatter": "esbenp.prettier-vscode") e restrinja o ESLint apenas às ações de código ("source.fixAll.eslint": "explicit"). Jamais permita que ambos tentem indentar o arquivo simultaneamente.

## 31. TailwindCSS v4 e Validação de CSS Nativo 🎨

- **Erradicação da Diretiva @apply:** O Tailwind v4 atua como um compilador nativo de CSS. É terminantemente proibido o uso de @apply para criar classes personalizadas, pois isso reintroduz o processamento AST desnecessário. Consuma as variáveis CSS expostas globalmente (ex: color: var(--color-slate-900)).

- **Supressão de Falsos Positivos na IDE:** Ao usar as diretivas modernas @import "tailwindcss" e @plugin, os validadores W3C padrão do VS Code atirarão erros de "Unknown at rule". É obrigatório silenciar a IDE ("css.lint.unknownAtRules": "ignore") e delegar a validação do arquivo exclusivamente à extensão oficial do Tailwind ("tailwindCSS.includeLanguages": { "css": "css" }).

## 32. Auditoria de Tooling e Manutenção Contínua 🛠️

- **Tolerância Zero a Chaves Obsoletas (Deprecation):** Ao configurar infraestrutura ou recuperar snippets antigos de IDE, valide imediatamente se a chave da API ainda é suportada. Uso de chaves depreciadas (como typescript.tsdk ao invés da correta js/ts.tsdk.path) quebra os servidores de linguagem (LSP) e destrói o IntelliSense do desenvolvedor. Remova configurações obsoletas imediatamente.
