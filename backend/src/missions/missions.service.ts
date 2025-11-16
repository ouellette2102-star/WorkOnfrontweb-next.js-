import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MissionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListAvailableMissionsDto } from './dto/list-available-missions.dto';
import {
  PublicMissionStatus,
  UpdateMissionStatusDto,
} from './dto/update-mission-status.dto';

type MissionSelect = {
  id: true;
  title: true;
  description: true;
  category: true;
  city: true;
  address: true;
  hourlyRate: true;
  startsAt: true;
  endsAt: true;
  status: true;
  createdAt: true;
  employerId: true;
};

type MissionRecord = Prisma.MissionGetPayload<{ select: MissionSelect }>;

const missionSelect: MissionSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  city: true,
  address: true,
  hourlyRate: true,
  startsAt: true,
  endsAt: true,
  status: true,
  createdAt: true,
  employerId: true,
};

export interface MissionResponse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  hourlyRate: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: PublicMissionStatus;
  createdAt: string;
}

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMissionForEmployer(
    userId: string,
    dto: CreateMissionDto,
  ): Promise<MissionResponse> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employer) {
      throw new ForbiddenException('Vous devez être employeur pour créer une mission');
    }

    const mission = await this.prisma.mission.create({
      data: {
        employerId: employer.id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        city: dto.city,
        address: dto.address,
        hourlyRate: dto.hourlyRate ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        status: MissionStatus.CREATED,
        location: this.buildLocation(dto),
        priceCents: this.computePriceCents(dto),
      },
      select: missionSelect,
    });

    return this.mapToResponse(mission);
  }

  async getMissionsForEmployer(userId: string): Promise<MissionResponse[]> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employer) {
      throw new ForbiddenException('Accès réservé aux employeurs WorkOn');
    }

    const missions = await this.prisma.mission.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
      select: missionSelect,
    });

    return missions.map((mission) => this.mapToResponse(mission));
  }

  async getAvailableMissionsForWorker(
    userId: string,
    filters: ListAvailableMissionsDto,
  ): Promise<MissionResponse[]> {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new ForbiddenException('Accès réservé aux workers WorkOn');
    }

    const missions = await this.prisma.mission.findMany({
      where: {
        status: MissionStatus.CREATED,
        city: filters.city ? { equals: filters.city, mode: 'insensitive' } : undefined,
        category: filters.category
          ? { equals: filters.category, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      select: missionSelect,
    });

    return missions.map((mission) => this.mapToResponse(mission));
  }

  async updateMissionStatus(
    userId: string,
    missionId: string,
    dto: UpdateMissionStatusDto,
  ): Promise<MissionResponse> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employer) {
      throw new ForbiddenException('Accès réservé aux employeurs WorkOn');
    }

    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: missionSelect,
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    if (mission.employerId !== employer.id) {
      throw new ForbiddenException('Impossible de modifier une mission qui ne vous appartient pas');
    }

    const prismaStatus = this.mapPublicToPrismaStatus(dto.status);

    const updated = await this.prisma.mission.update({
      where: { id: missionId },
      data: { status: prismaStatus },
      select: missionSelect,
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(mission: MissionRecord): MissionResponse {
    return {
      id: mission.id,
      title: mission.title,
      description: mission.description ?? null,
      category: mission.category ?? null,
      city: mission.city ?? null,
      address: mission.address ?? null,
      hourlyRate: mission.hourlyRate ?? null,
      startsAt: mission.startsAt ? mission.startsAt.toISOString() : null,
      endsAt: mission.endsAt ? mission.endsAt.toISOString() : null,
      status: this.mapPrismaToPublicStatus(mission.status),
      createdAt: mission.createdAt.toISOString(),
    };
  }

  private mapPrismaToPublicStatus(status: MissionStatus): PublicMissionStatus {
    switch (status) {
      case MissionStatus.CREATED:
        return PublicMissionStatus.OPEN;
      case MissionStatus.RESERVED:
      case MissionStatus.IN_PROGRESS:
        return PublicMissionStatus.ASSIGNED;
      case MissionStatus.COMPLETED:
        return PublicMissionStatus.DONE;
      case MissionStatus.CANCELLED:
        return PublicMissionStatus.CANCELLED;
      default:
        return PublicMissionStatus.OPEN;
    }
  }

  private mapPublicToPrismaStatus(status: PublicMissionStatus): MissionStatus {
    switch (status) {
      case PublicMissionStatus.OPEN:
        return MissionStatus.CREATED;
      case PublicMissionStatus.ASSIGNED:
        return MissionStatus.IN_PROGRESS;
      case PublicMissionStatus.DONE:
        return MissionStatus.COMPLETED;
      case PublicMissionStatus.CANCELLED:
        return MissionStatus.CANCELLED;
      default:
        throw new BadRequestException('Statut de mission non pris en charge');
    }
  }

  private buildLocation(dto: CreateMissionDto): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify({
        lat: 0,
        lng: 0,
        city: dto.city ?? null,
        address: dto.address ?? null,
      }),
    );
  }

  private computePriceCents(dto: CreateMissionDto): number {
    if (typeof dto.hourlyRate === 'number' && Number.isFinite(dto.hourlyRate)) {
      return Math.max(0, Math.round(dto.hourlyRate * 100));
    }
    return 0;
  }
}

