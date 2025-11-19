import { Module, forwardRef } from '@nestjs/common';
import { PaymentsLocalController } from './payments-local.controller';
import { PaymentsLocalService } from './payments-local.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule), // Required for JwtAuthGuard
  ],
  controllers: [PaymentsLocalController],
  providers: [PaymentsLocalService],
  exports: [PaymentsLocalService],
})
export class PaymentsLocalModule {}

