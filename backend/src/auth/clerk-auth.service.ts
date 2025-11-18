import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ClerkJwtPayload = {
  sub?: string;
  email?: string;
  email_address?: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async verifyAndSyncUser(token: string) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new UnauthorizedException(
        'Clerk n’est pas configuré côté backend (CLERK_SECRET_KEY manquante)',
      );
    }

    try {
      const issuer = this.configService.get<string>(
        'CLERK_ISSUER',
        'https://clerk.accounts.dev',
      );

      const payload = (await verifyToken(token, {
        secretKey,
        issuer,
      })) as ClerkJwtPayload;

      const clerkId = payload.sub;
      if (!clerkId) {
        throw new UnauthorizedException('Token Clerk invalide (sub manquante)');
      }

      const email =
        payload.email ??
        payload.email_address ??
        payload.email_addresses?.[0]?.email_address;

      let user = await this.prisma.user.findFirst({
        where: { clerkId },
      });

      if (!user && email) {
        user = await this.prisma.user.findUnique({
          where: { email },
        });
      }

      const fallbackName =
        `${payload.first_name ?? ''} ${payload.last_name ?? ''}`.trim() || 'Utilisateur Clerk';

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: email ?? `${clerkId}@clerk.local`,
            clerkId,
            name: fallbackName,
            role: UserRole.WORKER,
            profile: {},
            active: true,
          },
        });
      } else if (!user.clerkId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { clerkId },
        });
      }

      // Utiliser primaryRole si défini, sinon fallback sur role
      // Cela permet de respecter le choix de l'utilisateur lors de l'onboarding
      const effectiveRole = user.primaryRole ?? user.role;

      // Debug log temporaire
      this.logger.debug(
        `User verified: id=${user.id}, clerkId=${clerkId}, role=${user.role}, primaryRole=${user.primaryRole}, effectiveRole=${effectiveRole}`,
      );

      return {
        sub: user.id,
        clerkId,
        email: user.email,
        role: effectiveRole,
        claims: payload,
      };
    } catch (error) {
      this.logger.error('Échec de vérification Clerk', error as Error);
      throw new UnauthorizedException('Token Clerk invalide');
    }
  }
}

