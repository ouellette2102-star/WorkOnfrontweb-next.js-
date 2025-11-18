/**
 * Validation stricte des variables d'environnement requises
 * 
 * Ce module valide au démarrage que toutes les variables critiques
 * sont présentes et correctement formatées. Si une variable manque,
 * l'application crashe immédiatement avec un message clair.
 * 
 * SÉCURITÉ : Empêche le démarrage avec une config incomplète.
 */

import { IsString, IsNotEmpty, IsOptional, IsIn, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  CLERK_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  CLERK_ISSUER?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsIn(['development', 'production', 'test'])
  @IsNotEmpty()
  NODE_ENV: string;

  @IsString()
  @IsOptional()
  PORT?: string;

  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;
}

/**
 * Valide les variables d'environnement au démarrage
 * Lance une erreur si une variable requise manque
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown error';
      return `  ❌ ${error.property}: ${constraints}`;
    });

    throw new Error(
      `❌ CONFIGURATION ERROR - Missing or invalid environment variables:\n\n${messages.join('\n')}\n\n` +
      `Please check your .env file in backend/ directory.\n` +
      `Required variables: DATABASE_URL, CLERK_SECRET_KEY, NODE_ENV\n`,
    );
  }

  // Avertissements pour les variables optionnelles mais recommandées
  if (!validatedConfig.STRIPE_SECRET_KEY) {
    console.warn(
      '⚠️  WARNING: STRIPE_SECRET_KEY is not set. Payment features will not work.',
    );
  }

  if (!validatedConfig.JWT_SECRET) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET is not set. Local JWT auth will not work (Clerk only).',
    );
  }

  if (!validatedConfig.SENTRY_DSN && validatedConfig.NODE_ENV === 'production') {
    console.warn(
      '⚠️  WARNING: SENTRY_DSN is not set. Error tracking disabled in production.',
    );
  }

  return validatedConfig;
}

