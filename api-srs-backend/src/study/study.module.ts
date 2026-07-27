import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { StudyResolver } from './study.resolver';
import { StudyService } from './study.service';

@Module({
  imports: [PrismaModule, UserModule], // <-- Adicione UserModule aqui
  providers: [StudyService, StudyResolver],
  exports: [StudyService],
})
export class StudyModule { }
