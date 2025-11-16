import { IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  missionId: string;
}

