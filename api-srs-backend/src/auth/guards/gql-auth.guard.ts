import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RequestWithUser extends Request {
  user?: User;
}

interface GqlContext {
  req: RequestWithUser;
}

@Injectable()
export class GqlAuthGuard implements CanActivate {
  // SOLUÇÃO 1: Inferência Absoluta
  // Em vez de importar e forçar a classe genérica 'SupabaseClient',
  // capturamos exatamente o tipo de retorno da função 'createClient' instalada.
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL ou Anon Key ausentes no ambiente.');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const req = gqlContext.req;

    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException(
        'Acesso negado. Token ausente ou inválido.',
      );
    }

    // EXTRAÇÃO ROBUSTA: Protege contra erros de digitação e case sensitivity no Sandbox
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException(
        'Formato de token inválido. O formato correto é: Bearer <token>',
      );
    }

    const token = parts[1];
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error !== null || !data.user) {
      // LOG DE DEPURAÇÃO: Exibe no console do NestJS o motivo exato da falha do Supabase
      console.error('[Supabase Auth Error]:', error?.message);
      throw new UnauthorizedException(
        'Sessão inválida ou expirada no provedor.',
      );
    }

    const authId = data.user.id;

    // SOLUÇÃO DEFINITIVA: Tipagem estrita de 'string'.
    // Caso o Supabase não retorne um e-mail, garantimos um hash único e válido para o Prisma.
    const email: string = data.user.email
      ? data.user.email
      : `${authId}@no-email.local`;

    // SOLUÇÃO 3: Type-Guard Rigoroso contra o tipo 'any'
    // Convertendo o JSONB do Supabase em 'unknown' antes da extração.
    let name = 'Estudante';
    const metadata = data.user.user_metadata;

    if (metadata && typeof metadata === 'object' && 'full_name' in metadata) {
      const rawName = (metadata as Record<string, unknown>).full_name;
      if (typeof rawName === 'string') {
        name = rawName;
      }
    }

    const internalUser = await this.prisma.user.upsert({
      where: { authId },
      update: {},
      create: {
        authId,
        email, // Enviará string ou null de forma correta ao PostgreSQL
        name,
      },
    });

    req.user = internalUser;
    return true;
  }
}
