import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { StudyResolver } from './study.resolver';
import { StudyService } from './study.service';
import { RolloverService } from '../common/services/rollover.service';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [StudyService, StudyResolver, RolloverService],
  exports: [StudyService],
})
export class StudyModule { }
