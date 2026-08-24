import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class RolloverService {
  /**
   * RN06: Calcula a data "lógica" de estudo baseada no fuso horário do usuário.
   * 🔴 CORREÇÃO: Adicionado valor padrão 'America/Sao_Paulo' na assinatura do parâmetro
   */
  public getLogicalStudyDate(
    userTimezone: string = 'America/Sao_Paulo',
    referenceDate: Date = new Date(),
  ): dayjs.Dayjs {
    // Garante um fuso horário válido mesmo se uma string vazia ou inválida for fornecida
    const safeTimezone = userTimezone || 'America/Sao_Paulo';
    const localTime = dayjs(referenceDate).tz(safeTimezone);
    
    const currentHour = localTime.hour();
    const rolloverOffset = 4; // 04:00 AM conforme RN06

    if (currentHour < rolloverOffset) {
      return localTime.subtract(1, 'day');
    }

    return localTime;
  }

  /**
   * Fornece os limites exatos (Start e End) do ciclo de estudo para consultas no Prisma.
   * 🔴 CORREÇÃO: Parâmetro userTimezone agora possui valor padrão e aceita chamadas seguras
   */
  public getStudyDayBounds(
    userTimezone: string = 'America/Sao_Paulo',
    referenceDate: Date = new Date(),
  ): { start: Date; end: Date } {
    const logicalDate = this.getLogicalStudyDate(userTimezone, referenceDate);

    const startOfStudyDay = logicalDate.hour(4).minute(0).second(0).millisecond(0);
    const endOfStudyDay = startOfStudyDay.add(1, 'day').subtract(1, 'millisecond');

    return {
      start: startOfStudyDay.toDate(),
      end: endOfStudyDay.toDate(),
    };
  }
}