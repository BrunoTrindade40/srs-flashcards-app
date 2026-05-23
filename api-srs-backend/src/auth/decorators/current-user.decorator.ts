import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';

// 1. Contrato estrito para o Contexto GraphQL, banindo inferências de 'any'
interface GqlContext {
  req: {
    user?: User;
  };
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context);

    // 2. Injeção do Generic: O TypeScript agora sabe exatamente que 'getContext' retorna 'GqlContext'
    const gqlContext = ctx.getContext<GqlContext>();
    const req = gqlContext.req;

    // 3. Validação segura e tipada
    if (!req || !req.user) {
      throw new Error(
        'Falha de Arquitetura: Tentativa de acessar CurrentUser sem validação prévia do GqlAuthGuard.',
      );
    }

    return req.user;
  },
);
