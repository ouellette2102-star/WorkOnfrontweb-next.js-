import { Module, forwardRef } from '@nestjs/common';
import { MissionsLocalController } from './missions-local.controller';
import { MissionsLocalService } from './missions-local.service';
import { MissionsLocalRepository } from './missions-local.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule), // Required for JwtAuthGuard
  ],
  controllers: [MissionsLocalController],
  providers: [MissionsLocalService, MissionsLocalRepository],
  exports: [MissionsLocalService],
})
export class MissionsLocalModule {}

