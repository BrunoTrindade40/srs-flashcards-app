import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // Prepara a extração futura do token JWT
    GqlExecutionContext.create(context);

    // Retorna o formato exato esperado pelo deck.resolver.ts: { id: string }
    return { id: 'uuid-mock-temporario-1234' };
  },
);
