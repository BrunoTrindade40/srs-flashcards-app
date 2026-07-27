import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { DeckResolver } from './deck.resolver';
import { DeckService } from './deck.service';

@Module({
  imports: [PrismaModule, UserModule], // <-- Adicione UserModule aqui
  providers: [DeckService, DeckResolver],
  exports: [DeckService],
})
export class DeckModule { }
