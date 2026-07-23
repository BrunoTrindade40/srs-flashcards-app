import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, Flashcard as PrismaFlashcard } from '@prisma/client';
import { createEmptyCard, FSRS, Card as FSRSCard, Rating } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

// 🟡 CORREÇÃO ALERTA: Definição do Tipo Dinâmico Relacional
// Isso cria um tipo exato baseado na query que você faz no banco de dados, incluindo as relações.
type FSRSRecordWithFlashcard = Prisma.CardFSRSDataGetPayload<{
  include: { flashcard: { include: { deck: true } } };
}>;

@Injectable()
export class StudyService {
  // Inicialização do Motor FSRS Oficial
  // CORREÇÃO 1: Na versão 5+, o construtor exige um argumento. Passar {} aplica os pesos padrão da rede neural.
  private fsrs = new FSRS({});

  constructor(private readonly prisma: PrismaService) { }

  /**
   * UTILITÁRIO: Calcula o início do "Dia de Estudo" (RN06)
   * O sistema considera o início de um novo dia às 04:00 AM do horário local do usuário.
   */
  private getStartOfStudyDay(userTimezone: string = 'America/Sao_Paulo'): Date {
    let localTime = dayjs().tz(userTimezone);

    // Se ainda não deu 04:00 AM, consideramos que ainda é o "dia anterior" de estudos
    if (localTime.hour() < 4) {
      localTime = localTime.subtract(1, 'day');
    }

    // Zera os relógios para 04:00:00 do dia correto
    return localTime.hour(4).minute(0).second(0).millisecond(0).toDate();
  }

  // 🔵 SUGESTÃO APLICADA: DRY - Mapeador universal de registros FSRS para PrismaFlashcard
  private mapFsrsToCard(records: FSRSRecordWithFlashcard[]): PrismaFlashcard[] {
    return records.map((record) => {
      const { flashcard, ...fsrsMetadata } = record;
      return {
        ...flashcard,
        fsrsData: [fsrsMetadata],
      } as PrismaFlashcard;
    });
  }

  /**
   * RF04: Motor de Sessão de Estudo
   */
  async dueFlashcards(
    userId: string,
    deckId: string,
  ): Promise<PrismaFlashcard[]> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      // 🔴 CORREÇÃO CRÍTICA: Bloqueio de baralho arquivado
      select: { creatorId: true, isArchived: true },
    });

    if (!deck || deck.creatorId !== userId || deck.isArchived) {
      throw new ForbiddenException('Acesso negado ou Baralho arquivado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true, timezone: true },
    });

    const baseNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;
    const now = new Date();
    const todayStart = this.getStartOfStudyDay(user?.timezone);

    const distinctCardsReviewedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart } },
    });

    const reviewsDoneToday = distinctCardsReviewedToday.length;
    const remainingReviewsQuota = Math.max(0, maxDailyReviews - reviewsDoneToday);

    // 1. FILA CRÍTICA
    // 🔴 CORREÇÃO CRÍTICA: Inversão de Query (Busca em CardFSRSData) para permitir orderBy
    const criticalRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        due: { lte: now },
        state: { in: [1, 3] },
        flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
      },
      orderBy: { due: 'asc' }, // Traz os mais urgentes/esquecidos primeiro
      include: { flashcard: { include: { deck: true } } },
    });

    // 2. FILA DE REVISÃO
    let reviewRecords: FSRSRecordWithFlashcard[] = [];
    let effectiveNewCardLimit = baseNewCardLimit;

    if (remainingReviewsQuota > 0) {
      const pendingReviewsCount = await this.prisma.cardFSRSData.count({
        where: {
          userId,
          due: { lte: now },
          state: 2,
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
      });

      if (pendingReviewsCount >= maxDailyReviews) {
        effectiveNewCardLimit = 0;
      } else if (pendingReviewsCount > (maxDailyReviews * 0.8)) {
        effectiveNewCardLimit = Math.min(baseNewCardLimit, maxDailyReviews - pendingReviewsCount);
      }

      reviewRecords = await this.prisma.cardFSRSData.findMany({
        where: {
          userId,
          due: { lte: now },
          state: 2,
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
        orderBy: { due: 'asc' }, // 🔴 FUNDAMENTAL para SRS: Ordenação temporal ativada
        take: remainingReviewsQuota,
        include: { flashcard: { include: { deck: true } } },
      });
    } else {
      effectiveNewCardLimit = 0;
    }

    // 3. FILA DE NOVOS CARTÕES
    let newRecords: FSRSRecordWithFlashcard[] = [];
    if (effectiveNewCardLimit > 0) {
      newRecords = await this.prisma.cardFSRSData.findMany({
        where: {
          userId,
          state: 0,
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
        orderBy: { createdAt: 'asc' }, // Novidades respeitam a ordem de criação do professor
        take: effectiveNewCardLimit,
        include: { flashcard: { include: { deck: true } } },
      });
    }

    const combinedQueue: PrismaFlashcard[] = [
      ...this.mapFsrsToCard(criticalRecords),
      ...this.mapFsrsToCard(reviewRecords),
      ...this.mapFsrsToCard(newRecords),
    ];

    return this.shuffleArray(combinedQueue);
  }

  /**
   * RF05: Avaliação de Retenção - Usando a Biblioteca FSRS Matemática Oficial
   */
  async submitReview(
    userId: string,
    flashcardId: string,
    rating: number, // 1: Errei, 2: Difícil, 3: Bom, 4: Fácil
    reviewDurationMs: number,
  ): Promise<boolean> {
    const validRatings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
    if (!validRatings.includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }

    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
      include: { deck: { select: { creatorId: true } } },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new ForbiddenException('Cartão encontrado ou acesso negado.');
    }

    const [fsrsDataRecord, userRecord] = await Promise.all([
      this.prisma.cardFSRSData.findUnique({
        where: { flashcardId_userId: { flashcardId, userId } }
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fsrsWeights: true },
      }),
    ]);

    let currentFsrsCard: FSRSCard;

    // 🔴 CORREÇÃO CRÍTICA: Inicialização condicional da rede neural.
    let activeFsrs = this.fsrs; // Fallback para a instância padrão

    // Verificamos se há pesos gravados e se o JSON é válido/array.
    if (userRecord?.fsrsWeights && Array.isArray(userRecord.fsrsWeights)) {
      activeFsrs = new FSRS({ w: userRecord.fsrsWeights as number[] });
    }

    if (!fsrsDataRecord) {
      currentFsrsCard = createEmptyCard();
    } else {
      // 🔴 CORREÇÃO CRÍTICA: As chaves exigidas pela interface Card na v5.4.1
      currentFsrsCard = {
        ...createEmptyCard(),
        due: fsrsDataRecord.due,
        stability: fsrsDataRecord.stability,
        difficulty: fsrsDataRecord.difficulty,
        elapsed_days: fsrsDataRecord.elapsedDays,
        scheduled_days: fsrsDataRecord.scheduledDays,
        reps: fsrsDataRecord.reps,
        lapses: fsrsDataRecord.lapses,
        state: fsrsDataRecord.state,
        last_review: fsrsDataRecord.lastReview || undefined,
      };
    }

    const now = new Date();

    // 🔴 CORREÇÃO CRÍTICA APLICADA:
    // O método 'next' agora é chamado EXATAMENTE na instância 'activeFsrs',
    // garantindo que os cálculos de retenção utilizem a assinatura cerebral (pesos) do estudante.
    const reviewResult = activeFsrs.next(currentFsrsCard, now, rating);
    const nextState = reviewResult.card;

    const sanitizedDurationMs = Math.min(reviewDurationMs, 60000);

    // Persistência em Transação (Atomicidade)
    await this.prisma.$transaction([
      this.prisma.cardFSRSData.upsert({
        where: { flashcardId_userId: { flashcardId, userId } },
        update: {
          stability: nextState.stability,
          difficulty: nextState.difficulty,
          // 🔴 CORREÇÃO CRÍTICA: Retorno ao mapeamento seguro para o Prisma
          elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days,
          reps: nextState.reps,
          lapses: nextState.lapses,
          state: nextState.state,
          lastReview: nextState.last_review,
          due: nextState.due,
        },
        create: {
          flashcardId,
          userId,
          stability: nextState.stability,
          difficulty: nextState.difficulty,
          elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days,
          reps: nextState.reps,
          lapses: nextState.lapses,
          state: nextState.state,
          lastReview: nextState.last_review,
          due: nextState.due,
        }
      }),
      this.prisma.reviewLog.create({
        data: {
          flashcardId,
          userId,
          rating,
          reviewDurationMs: sanitizedDurationMs,
          elapsedDays: nextState.elapsed_days, // <-- Correção na entidade dependente
          stabilityBefore: currentFsrsCard.stability,
          difficultyBefore: currentFsrsCard.difficulty,
          stabilityAfter: nextState.stability,
          difficultyAfter: nextState.difficulty,
          isFatiguedReview: false
        },
      }),
    ]);

    return true;
  }

  /**
   * UC10 - Executar estudos no "Modo Chaos" (Interleaving)
   * Mistura cards atrasados de diferentes decks para forçar o cérebro a alternar contextos.
   * * @param userId ID do estudante autenticado (provido pelo token JWT/Supabase)
   * @param limit Limite máximo de revisões para mitigar o "Efeito Bola de Neve"
   */
  async getChaosStudyQueue(userId: string, limit: number = 50): Promise<PrismaFlashcard[]> {
    const now = dayjs().toDate();

    const dueFsrsRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId: userId,
        due: {
          lte: now,
        },
        flashcard: {
          front: { not: ANONYMIZED_PAYLOAD },
          deck: {
            creatorId: userId,
            isArchived: false, // 🔴 CORREÇÃO CRÍTICA: Proteção do Modo Chaos
          },
        },
      },
      include: {
        flashcard: {
          include: {
            deck: true,
          },
        },
      },
      orderBy: {
        due: 'asc',
      },
      take: limit,
    });

    // Utiliza o mapeador DRY abstraído
    return this.shuffleArray(this.mapFsrsToCard(dueFsrsRecords));
  }

  /**
   * Algoritmo Fisher-Yates para embaralhar arrays de forma otimizada O(n).
   * Ele garante que as matérias ("Biologia", "Alemão") fiquem misturadas de forma randômica.
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Gera um índice aleatório entre 0 e i
      const j = Math.floor(Math.random() * (i + 1));
      // Troca os elementos de lugar
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}