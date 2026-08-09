import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { FlashcardResolver } from './flashcard.resolver';
import { FlashcardService } from './flashcard.service';
// 🔴 CORREÇÃO CRÍTICA: Importação do DataLoader ausente
import { FsrsDataLoader } from './dataloaders/fsrs.dataloader';

@Module({
  imports: [PrismaModule, UserModule], // <-- Adicione UserModule aqui
  providers: [
    FlashcardService, 
    FlashcardResolver, 
    FsrsDataLoader // 🔴 DECLARAÇÃO OBRIGATÓRIA: Registra o provider no módulo
  ],
  exports: [FlashcardService],
})
export class FlashcardModule { }
