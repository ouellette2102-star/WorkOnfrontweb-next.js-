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

    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (jwtSecret) {
      try {
        const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
        request.user = {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          provider: 'local',
        };
        return true;
      } catch (error) {
        // On essaie ensuite via Clerk
      }
    }

    const clerkUser = await this.clerkAuthService.verifyAndSyncUser(token);
    request.user = {
      sub: clerkUser.sub,
      email: clerkUser.email,
      role: clerkUser.role,
      provider: 'clerk',
      clerkId: clerkUser.clerkId,
      claims: clerkUser.claims,
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

