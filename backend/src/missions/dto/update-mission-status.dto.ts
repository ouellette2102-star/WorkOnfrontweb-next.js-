import { IsEnum } from 'class-validator';

export enum PublicMissionStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export class UpdateMissionStatusDto {
  @IsEnum(PublicMissionStatus, {
    message: 'status must be one of OPEN, ASSIGNED, DONE, CANCELLED',
  })
  status!: PublicMissionStatus;
}

