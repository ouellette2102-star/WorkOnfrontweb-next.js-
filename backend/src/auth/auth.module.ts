import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './clerk-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// Local Auth (email/password)
import { LocalAuthController } from './local-auth.controller';
import { LocalAuthService } from './local-auth.service';
import { JwtLocalStrategy } from './strategies/jwt-local.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule), // Use forwardRef to break circular dependency
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController, LocalAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    ClerkAuthService,
    JwtAuthGuard,
    // Local Auth
    LocalAuthService,
    JwtLocalStrategy,
  ],
  exports: [
    AuthService,
    ClerkAuthService,
    JwtAuthGuard,
    JwtModule, // Export JwtModule so other modules can use JwtService
    PassportModule, // Export PassportModule for strategies
    LocalAuthService,
  ],
})
export class AuthModule {}

