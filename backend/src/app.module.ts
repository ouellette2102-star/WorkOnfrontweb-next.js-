import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './missions/missions.module';
import { PaymentsModule } from './payments/payments.module';
import { ContractsModule } from './contracts/contracts.module';
import { AdminModule } from './admin/admin.module';
import { LoggerModule } from './logger/logger.module';
import { ProfileModule } from './profile/profile.module';
import { MessagesModule } from './messages';
import { NotificationsModule } from './notifications/notifications.module';
import { MissionTimeLogsModule } from './mission-time-logs/mission-time-logs.module';
import { MissionPhotosModule } from './mission-photos/mission-photos.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => {
        const ttl = config.get<number>('THROTTLE_TTL', 60);
        const limit = config.get<number>('THROTTLE_LIMIT', 100);

        return {
          throttlers: [
            {
              name: 'global',
              ttl,
              limit,
            },
          ],
        };
      },
    }),

    // Winston logging
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logLevel = config.get<string>('LOG_LEVEL', 'info');
        const nodeEnv = config.get<string>('NODE_ENV', 'development');

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
            // Format lisible pour le développement
            nodeEnv === 'development'
              ? winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                  return `${timestamp} [${level.toUpperCase()}]${requestId ? ` [${requestId}]` : ''} ${message} ${metaStr}`;
                })
              : winston.format.json(),
          ),
          defaultMeta: {
            service: 'workon-backend',
            environment: nodeEnv,
          },
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
              ),
            }),
            // Placeholder pour fichier de logs en production
            // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            // new winston.transports.File({ filename: 'logs/combined.log' }),
          ],
        };
      },
    }),

    // Modules métier
    PrismaModule,
    LoggerModule,
    AuthModule,
    MissionsModule,
    PaymentsModule,
    ContractsModule,
    AdminModule,
    ProfileModule,
    MessagesModule,
    NotificationsModule,
    MissionTimeLogsModule,
    MissionPhotosModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

