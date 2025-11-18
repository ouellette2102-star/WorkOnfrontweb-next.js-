import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as Sentry from '@sentry/node';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Logger sera configuré via Winston dans AppModule
    bufferLogs: true,
    // Activer rawBody pour les webhooks Stripe
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Sentry initialization (si DSN fourni)
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('SENTRY_ENVIRONMENT', nodeEnv),
      tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
      // Placeholder pour configuration additionnelle
    });
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  // Security middleware
  app.use(helmet());

  // CORS - Configuration stricte pour la sécurité
  // ⚠️ PRODUCTION: Remplacer par les domaines réels (ex: https://workon.app)
  // ⚠️ NE JAMAIS utiliser origin: '*' en production avec credentials: true
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  
  // En production, on refuse explicitement le wildcard
  if (nodeEnv === 'production' && corsOrigin === '*') {
    throw new Error(
      '❌ SECURITY ERROR: CORS_ORIGIN cannot be "*" in production when credentials are enabled. ' +
      'Set CORS_ORIGIN to your frontend domain (e.g., https://workon.app)',
    );
  }

  const origins =
    corsOrigin === '*'
      ? true // Autorisé uniquement en dev
      : corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Empêche les headers non autorisés
    exposedHeaders: ['X-Request-ID'],
    maxAge: 3600, // Cache preflight 1h
  });

  // Servir les fichiers statiques (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe avec Zod (via class-validator pour compatibilité NestJS)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Request ID middleware (pour traçabilité)
  app.use((req: any, res: any, next: any) => {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });

  // Health check endpoint
  app.getHttpAdapter().get('/healthz', (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Metrics placeholder endpoint
  app.getHttpAdapter().get('/metrics', (req: any, res: any) => {
    // Placeholder - à implémenter avec Prometheus si nécessaire
    res.json({ message: 'Metrics endpoint - à implémenter avec Prometheus' });
  });

  // Error handler Sentry (si activé)
  if (sentryDsn) {
    app.use(Sentry.Handlers.errorHandler());
  }

  await app.listen(port);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();