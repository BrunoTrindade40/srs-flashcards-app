import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Inicializa o contexto GraphQL (necessário para as validações do Supabase no RF01)
    GqlExecutionContext.create(context);

    // Mock temporário: Autoriza todas as requisições para permitir testes locais
    return true;
  }
}
