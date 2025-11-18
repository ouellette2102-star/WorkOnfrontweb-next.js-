import { Module } from '@nestjs/common';
import { PaymentsLocalController } from './payments-local.controller';
import { PaymentsLocalService } from './payments-local.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsLocalController],
  providers: [PaymentsLocalService],
  exports: [PaymentsLocalService],
})
export class PaymentsLocalModule {}

