import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { UserService } from '../../user/user.service';

export interface RequestWithUser extends Request {
  user?: User;
}

interface GqlContext {
  req: RequestWithUser;
}

@Injectable()
export class GqlAuthGuard implements CanActivate, OnModuleInit {
  private supabase!: SupabaseClient<any, 'public', any>;
  private readonly logger = new Logger(GqlAuthGuard.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) { }

  // 🔵 SUGESTÃO APLICADA (Boy Scout): Transferimos a inicialização para o ciclo de vida correto do NestJS
  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('FALHA CRÍTICA: SUPABASE_URL ou SUPABASE_ANON_KEY ausentes no arquivo .env do Backend.');
      throw new Error('Configuração de ambiente inválida para o Supabase.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    }) as SupabaseClient<any, 'public', any>;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const req = gqlContext.req;

    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Acesso negado. Token ausente ou inválido.');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException(
        'Formato de token inválido. O formato correto é: Bearer <token>',
      );
    }

    const token = parts[1].trim();

    const response = await this.supabase.auth.getUser(token);

    if (response.error || !response.data || !response.data.user) {
      this.logger.error(`Falha de autenticação: ${response.error?.message || 'Token corrompido.'}`);
      throw new UnauthorizedException('Token de acesso inválido, expirado ou forjado.');
    }

    const authId = response.data.user.id;
    const email: string = response.data.user.email || `${authId}@no-email.local`;

    const metadata = response.data.user.user_metadata as Record<string, unknown> | undefined;
    const rawName = metadata?.['full_name'];
    const name: string = typeof rawName === 'string' && rawName.trim() !== '' ? rawName.trim() : 'Estudante';

    const internalUser = await this.userService.upsertUserByAuthId(authId, email, name);

    req.user = internalUser;

    return true;
  }
}