import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ClerkAuthService } from '../clerk-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly clerkAuthService: ClerkAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization manquante');
    }

    // ⚠️ SÉCURITÉ: Ne jamais logger les tokens complets en production
    // Les tokens sont des secrets qui peuvent être utilisés pour usurper l'identité

    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    // Tentative 1: JWT local (si configuré)
    if (jwtSecret) {
      try {
        const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
        
        // ⚠️ SÉCURITÉ CRITIQUE: Le rôle et l'ID viennent UNIQUEMENT du JWT vérifié
        // Ne jamais accepter de valeurs fournies par le frontend (body/query/headers)
        request.user = {
          sub: payload.sub,
          email: payload.email,
          role: payload.role, // Extrait du JWT signé uniquement
          provider: 'local',
        };
        
        return true;
      } catch (error) {
        // Échec JWT local → On essaie via Clerk
      }
    }

    // Tentative 2: Clerk JWT (production principale)
    const clerkUser = await this.clerkAuthService.verifyAndSyncUser(token);
    
    // ⚠️ SÉCURITÉ CRITIQUE: Le rôle vient de Clerk (source de vérité)
    // primaryRole est extrait de la DB après vérification du token Clerk
    request.user = {
      sub: clerkUser.sub,           // ID interne (DB)
      email: clerkUser.email,       // Email vérifié par Clerk
      role: clerkUser.role,         // Rôle effectif (primaryRole ?? role)
      provider: 'clerk',
      clerkId: clerkUser.clerkId,   // ID Clerk (externe)
      claims: clerkUser.claims,     // Claims JWT Clerk originaux
    };

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}

