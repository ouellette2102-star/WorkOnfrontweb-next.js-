import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  // ⚠️ PRODUCTION: Définir FRONTEND_URL ou CORS_ORIGIN dans .env
  // ⚠️ NE JAMAIS utiliser origin: '*' en production avec credentials: true
  
  const isProd = nodeEnv === 'production';
  
  let allowedOrigins: string[] | boolean;

  if (isProd) {
    // PRODUCTION: Utiliser FRONTEND_URL ou CORS_ORIGIN (strict)
    const frontendUrl = configService.get<string>('FRONTEND_URL');
    const corsOrigin = configService.get<string>('CORS_ORIGIN');

    if (corsOrigin === '*') {
      throw new Error(
        '❌ SECURITY ERROR: CORS_ORIGIN cannot be "*" in production when credentials are enabled. ' +
        'Set CORS_ORIGIN or FRONTEND_URL to your frontend domain (e.g., https://workon.app)',
      );
    }

    if (frontendUrl) {
      allowedOrigins = [frontendUrl];
    } else if (corsOrigin) {
      allowedOrigins = corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    } else {
      throw new Error(
        '❌ CONFIGURATION ERROR: FRONTEND_URL or CORS_ORIGIN must be set in production. ' +
        'Add to .env: FRONTEND_URL=https://workon.app',
      );
    }

    console.log(`🔒 CORS enabled for production origins: ${allowedOrigins.join(', ')}`);
  } else {
    // DEVELOPMENT: Autoriser localhost sur plusieurs ports
    const corsOrigin = configService.get<string>('CORS_ORIGIN');
    
    if (corsOrigin && corsOrigin !== '*') {
      // Utiliser CORS_ORIGIN si défini en dev (pour tester)
      allowedOrigins = corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    } else {
      // Default dev: autoriser localhost
      allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001', // Backend (si besoin de s'appeler lui-même)
      ];
    }

    console.log(`🔓 CORS enabled for development origins: ${Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : 'all'}`);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: isProd ? 3600 : 300, // Cache preflight: 1h en prod, 5min en dev
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

  // Swagger API Documentation (development only)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WorkOn API')
      .setDescription('WorkOn - Uber-for-work marketplace API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints (register, login)')
      .addTag('users', 'User management')
      .addTag('health', 'Health check endpoint')
      .addTag('missions', 'Mission management')
      .addTag('payments', 'Payment processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();