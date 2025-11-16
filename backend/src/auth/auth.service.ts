import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(signupDto: SignupDto) {
    const { email, password, name, role } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        role,
        profile: {
          // Stocker le hash du mot de passe dans le profil (ou créer une table séparée en production)
          passwordHash: hashedPassword,
        },
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (role === 'EMPLOYER') {
      await this.prisma.employer.create({
        data: {
          userId: user.id,
          companyName: signupDto.companyName || name,
          billingInfo: {},
        },
      });
    } else if (role === 'WORKER') {
      await this.prisma.worker.create({
        data: {
          userId: user.id,
          skills: [],
          rating: 0,
          badges: [],
        },
      });
    }

    this.logger.log(`Nouvel utilisateur créé: ${user.email} (${user.role})`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Alias pour compatibilité avec les contrôleurs/tests existants
   */
  async signup(signupDto: SignupDto) {
    return this.register(signupDto);
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        employer: true,
        worker: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordHash = (user.profile as any)?.passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    this.logger.log(`Connexion réussie: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('Utilisateur invalide');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  /**
   * Déconnexion (invalidation du refresh token côté client)
   * Note: Pour une invalidation serveur-side, il faudrait une table de tokens blacklistés
   */
  async logout(userId: string) {
    this.logger.log(`Déconnexion: ${userId}`);
    return { message: 'Déconnexion réussie' };
  }

  /**
   * Générer les tokens JWT (access + refresh)
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Valider un utilisateur (pour Passport Local Strategy)
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.active) {
      return null;
    }

    const passwordHash = (user.profile as any)?.passwordHash;
    if (!passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

