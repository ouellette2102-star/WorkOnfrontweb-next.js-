import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileResponseDto, ProfileRole } from './dto/profile-response.dto';
import { Prisma, UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile-role.dto';

const userSelect = {
  id: true,
  clerkId: true,
  email: true,
  role: true,
  primaryRole: true,
  fullName: true,
  phone: true,
  city: true,
  profile: true,
  worker: { select: { id: true } },
  employer: { select: { id: true } },
} as const satisfies Prisma.UserSelect;

type UserWithRelations = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

type ProfileData = {
  primaryRole?: ProfileRole;
  fullName?: string;
  phone?: string;
  city?: string;
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.mapToProfileDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    this.logger.debug(
      `updateProfile called for userId=${userId} dto=${JSON.stringify(dto)}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: userSelect,
      });

      if (!user) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      const mappedRole = dto.primaryRole
        ? this.mapProfileRoleToUserRole(dto.primaryRole)
        : null;

      const updateData: Prisma.UserUpdateInput = {};

      if (mappedRole) {
        updateData.role = mappedRole;
        updateData.primaryRole = mappedRole;
      }
      if (dto.fullName !== undefined) {
        updateData.fullName = dto.fullName;
      }
      if (dto.phone !== undefined) {
        updateData.phone = dto.phone;
      }
      if (dto.city !== undefined) {
        updateData.city = dto.city;
      }

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: userSelect,
      });

      return this.mapToProfileDto(updated);
    } catch (error) {
      this.logger.error(
        `updateProfile failed for userId=${userId} dto=${JSON.stringify(dto)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private mapToProfileDto(user: UserWithRelations): ProfileResponseDto {
    const isWorker =
      user.role === UserRole.WORKER || Boolean(user.worker);
    const isEmployer =
      user.role === UserRole.EMPLOYER ||
      user.role === UserRole.ADMIN ||
      Boolean(user.employer);
    
    // Utiliser primaryRole depuis la DB, ou dériver depuis role si absent
    let derivedPrimaryRole: ProfileRole;
    if (user.primaryRole) {
      derivedPrimaryRole = this.mapUserRoleToProfileRole(user.primaryRole) ?? ProfileRole.WORKER;
    } else if (user.role) {
      derivedPrimaryRole = this.mapUserRoleToProfileRole(user.role) ?? ProfileRole.WORKER;
    } else if (isWorker) {
      derivedPrimaryRole = ProfileRole.WORKER;
    } else if (isEmployer) {
      derivedPrimaryRole = ProfileRole.EMPLOYER;
    } else {
      derivedPrimaryRole = ProfileRole.CLIENT_RESIDENTIAL;
    }

    const dto = new ProfileResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.fullName = user.fullName ?? '';
    dto.phone = user.phone ?? '';
    dto.city = user.city ?? '';
    dto.primaryRole = derivedPrimaryRole;
    dto.isWorker = isWorker;
    dto.isEmployer = isEmployer;
    dto.isClientResidential =
      derivedPrimaryRole === ProfileRole.CLIENT_RESIDENTIAL;

    return dto;
  }

  private resolvePrimaryRole(
    profileData: ProfileData,
    userRole: UserRole,
    isWorker: boolean,
    isEmployer: boolean,
  ): ProfileRole {
    if (
      profileData.primaryRole &&
      this.isProfileRole(profileData.primaryRole)
    ) {
      return profileData.primaryRole;
    }

    const mapped = this.mapUserRoleToProfileRole(userRole);
    if (mapped) {
      return mapped;
    }

    if (isWorker) {
      return ProfileRole.WORKER;
    }

    if (isEmployer) {
      return ProfileRole.EMPLOYER;
    }

    return ProfileRole.CLIENT_RESIDENTIAL;
  }

  private toProfileData(value: Prisma.JsonValue | null): ProfileData {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const raw = value as Record<string, unknown>;
    const data: ProfileData = {};

    if (this.isProfileRole(raw.primaryRole)) {
      data.primaryRole = raw.primaryRole;
    }
    if (typeof raw.fullName === 'string') {
      data.fullName = raw.fullName;
    }
    if (typeof raw.phone === 'string') {
      data.phone = raw.phone;
    }
    if (typeof raw.city === 'string') {
      data.city = raw.city;
    }

    return data;
  }

  private sanitizeProfileData(data: ProfileData): ProfileData {
    const sanitized: ProfileData = {};

    if (data.primaryRole && this.isProfileRole(data.primaryRole)) {
      sanitized.primaryRole = data.primaryRole;
    }

    if (data.fullName !== undefined) {
      sanitized.fullName = data.fullName?.trim() ?? '';
    }

    if (data.phone !== undefined) {
      sanitized.phone = data.phone?.trim() ?? '';
    }

    if (data.city !== undefined) {
      sanitized.city = data.city?.trim() ?? '';
    }

    return sanitized;
  }

  private toJsonValue(input: ProfileData): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(input ?? {}));
  }

  private mapProfileRoleToUserRole(role: ProfileRole): UserRole | null {
    switch (role) {
      case ProfileRole.WORKER:
        return UserRole.WORKER;
      case ProfileRole.EMPLOYER:
        return UserRole.EMPLOYER;
      case ProfileRole.ADMIN:
        return UserRole.ADMIN;
      default:
        return null;
    }
  }

  private mapUserRoleToProfileRole(role: UserRole): ProfileRole | null {
    switch (role) {
      case UserRole.WORKER:
        return ProfileRole.WORKER;
      case UserRole.EMPLOYER:
        return ProfileRole.EMPLOYER;
      case UserRole.ADMIN:
        return ProfileRole.ADMIN;
      default:
        return null;
    }
  }

  private isProfileRole(value: unknown): value is ProfileRole {
    return (
      typeof value === 'string' &&
      Object.values(ProfileRole).includes(value as ProfileRole)
    );
  }
}

