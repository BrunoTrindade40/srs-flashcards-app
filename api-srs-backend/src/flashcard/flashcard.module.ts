import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FlashcardResolver } from './flashcard.resolver';
import { FlashcardService } from './flashcard.service';

@Module({
  imports: [PrismaModule],
  providers: [FlashcardResolver, FlashcardService],
  exports: [FlashcardService],
})
export class FlashcardModule {}
