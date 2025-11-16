import { Module, forwardRef } from '@nestjs/common';
import { MissionTimeLogsController } from './mission-time-logs.controller';
import { MissionTimeLogsService } from './mission-time-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)],
  controllers: [MissionTimeLogsController],
  providers: [MissionTimeLogsService],
  exports: [MissionTimeLogsService],
})
export class MissionTimeLogsModule {}

