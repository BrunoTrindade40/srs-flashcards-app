import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { FlashcardResolver } from './flashcard.resolver';
import { FlashcardService } from './flashcard.service';

@Module({
  imports: [PrismaModule, UserModule], // <-- Adicione UserModule aqui
  providers: [FlashcardService, FlashcardResolver],
  exports: [FlashcardService],
})
export class FlashcardModule { }
