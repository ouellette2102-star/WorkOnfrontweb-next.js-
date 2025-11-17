import { IsInt, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  missionId: string;

  @IsInt()
  @Min(100) // Minimum 1$ CAD
  amountCents: number;
}

