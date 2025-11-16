import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListAvailableMissionsDto } from './dto/list-available-missions.dto';
import { UpdateMissionStatusDto } from './dto/update-mission-status.dto';
import { UserRole } from '@prisma/client';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  createMission(@Request() req: any, @Body() dto: CreateMissionDto) {
    return this.missionsService.createMissionForEmployer(req.user.sub, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  listEmployerMissions(@Request() req: any) {
    return this.missionsService.getMissionsForEmployer(req.user.sub);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WORKER)
  listAvailableMissions(
    @Request() req: any,
    @Query() filters: ListAvailableMissionsDto,
  ) {
    return this.missionsService.getAvailableMissionsForWorker(req.user.sub, filters);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  updateStatus(
    @Request() req: any,
    @Param('id') missionId: string,
    @Body() dto: UpdateMissionStatusDto,
  ) {
    return this.missionsService.updateMissionStatus(req.user.sub, missionId, dto);
  }
}