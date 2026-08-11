import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Substitua o caminho relativo abaixo para apontar para o arquivo físico gerado pelo seu NestJS.
  // Isso remove a necessidade de ter o servidor HTTP online durante o desenvolvimento do frontend.
  schema: '../api-srs-backend/src/schema.gql', 
  
  // Lê as operações de GraphQL dos componentes Flexbox e Hooks
  documents: ['src/**/*.tsx', 'src/**/*.ts', '!src/gql/**/*'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      // CORREÇÃO: Força o uso de "import type" para apaziguar o verbatimModuleSyntax do Vite
      config: {
        useTypeImports: true
      }
    }
  }
};

export default config;