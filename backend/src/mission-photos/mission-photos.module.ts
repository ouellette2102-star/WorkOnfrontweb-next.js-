import { Module } from '@nestjs/common';
import { MissionPhotosController } from './mission-photos.controller';
import { MissionPhotosService } from './mission-photos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MissionPhotosController],
  providers: [MissionPhotosService],
  exports: [MissionPhotosService],
})
export class MissionPhotosModule {}

