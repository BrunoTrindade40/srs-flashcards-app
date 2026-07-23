import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RequestWithUser extends Request {
  user?: User;
}

interface GqlContext {
  req: RequestWithUser;
}

interface SupabaseJwtPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

@Injectable()
export class GqlAuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new Error('Falha Crítica: SUPABASE_JWT_SECRET ausente no ambiente.');
    }
    this.jwtSecret = secret;
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

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException(
        'Formato de token inválido. O formato correto é: Bearer <token>',
      );
    }

    const token = parts[1];
    let decoded: SupabaseJwtPayload;

    try {
      decoded = jwt.verify(token, this.jwtSecret) as SupabaseJwtPayload;
    } catch {
      // CORREÇÃO: Aplicação do Optional Catch Binding (ES2019+).
      // A variável (error) foi removida, extinguindo o erro do Linter de variável não utilizada.
      throw new UnauthorizedException('Token de acesso inválido, forjado ou expirado.');
    }

    const authId = decoded.sub;

    let internalUser = await this.prisma.user.findUnique({
      where: { authId },
    });

    if (!internalUser) {
      const email: string = decoded.email || `${authId}@no-email.local`;
      const name: string = decoded.user_metadata?.full_name || 'Estudante';

      internalUser = await this.prisma.user.create({
        data: {
          authId,
          email,
          name,
        },
      });
    }

    req.user = internalUser;
    return true;
  }
}