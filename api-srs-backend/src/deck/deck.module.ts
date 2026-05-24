import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeckResolver } from './deck.resolver';
import { DeckService } from './deck.service';

@Module({
  imports: [PrismaModule],
  providers: [DeckResolver, DeckService],
  exports: [DeckService],
})
export class DeckModule {}
