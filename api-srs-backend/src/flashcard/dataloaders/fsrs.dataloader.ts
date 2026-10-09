import { Injectable, Scope } from '@nestjs/common';
// 🔵 SUGESTÃO APLICADA: Importação direta alinhada com o tsconfig do projeto
import DataLoader from 'dataloader';
import { PrismaService } from '../../../prisma/prisma.service';
import { CardFSRSData } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class FsrsDataLoader {
  constructor(private readonly prisma: PrismaService) {}

  // 🔴 CORREÇÃO CRÍTICA: Adição do terceiro parâmetro genérico 'string' (C)
  public readonly loader = new DataLoader<
    { flashcardId: string; userId: string }, // K: Tipo da entrada
    CardFSRSData | null,                     // V: Tipo do retorno
    string                                   // C: Tipo da chave de cache
  >(
    async (keys) => {
      const flashcardIds = keys.map((k) => k.flashcardId);
      const userId = keys[0].userId; 

      const records = await this.prisma.cardFSRSData.findMany({
        where: {
          userId,
          flashcardId: { in: flashcardIds },
        },
      });

      const map = new Map(records.map((r) => [r.flashcardId, r]));
      return keys.map((k) => map.get(k.flashcardId) || null);
    },
    {
      // Agora o TypeScript sabe que o retorno desta função será uma string validada
      cacheKeyFn: (key) => `${key.userId}:${key.flashcardId}`,
    }
  );
}