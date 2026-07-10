import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudyResolver } from './study.resolver';
import { StudyService } from './study.service';

@Module({
  imports: [PrismaModule],
  providers: [StudyService, StudyResolver],
  exports: [StudyService],
})
// eslint-disable-next-line prettier/prettier
export class StudyModule { }
