import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({
    example: 'cly123abc...',
    description: 'User unique identifier',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @Expose()
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @Expose()
  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @Expose()
  @ApiProperty({
    example: '+1 514 555 0100',
    description: 'User phone number',
    nullable: true,
  })
  phone: string | null;

  @Expose()
  @ApiProperty({
    example: 'Montréal',
    description: 'User city/region',
    nullable: true,
  })
  city: string | null;

  @Expose()
  @ApiProperty({
    example: 'worker',
    description: 'User role',
  })
  role: string;

  @Expose()
  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Account creation date',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;

  // hashedPassword is excluded by default via @Exclude() decorator
}

