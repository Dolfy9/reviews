import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../config/prisma.service";
import { UsersRepository } from "../users/users.repository";
import { User, RefreshToken } from "@prisma/client";
import { Env } from "../../config/env.schema";
import { hashToken, generateToken } from "../../common/hash.util";
import { durationToMs } from "../../common/duration.util";
import { toUserDto } from "../../common/mappers";
import { RegisterInput, LoginInput, UserDto } from "@product-reviews/shared";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterInput, res: Response): Promise<UserDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name ?? null,
    });

    await this.setAuthCookies(user, res);
    return toUserDto(user);
  }

  async login(dto: LoginInput, res: Response): Promise<UserDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.setAuthCookies(user, res);
    return toUserDto(user);
  }

  async logout(refreshToken: string | undefined, res: Response): Promise<void> {
    if (refreshToken) {
      await this.deleteRefreshToken(hashToken(refreshToken));
    }
    this.clearAuthCookies(res);
  }

  async refreshTokens(
    refreshToken: string | undefined,
    res: Response,
  ): Promise<UserDto> {
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow("JWT_SECRET", { infer: true }),
      });
    } catch {
      this.clearAuthCookies(res);
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.expiresAt < new Date()) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.usersRepository.findById(stored.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.deleteRefreshToken(tokenHash);
    await this.setAuthCookies(user, res);
    return toUserDto(user);
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return toUserDto(user);
  }

  private async setAuthCookies(user: User, res: Response): Promise<void> {
    const accessToken = this.signAccessToken(user);
    const refreshTokenValue = generateToken();
    const refreshToken = this.signRefreshToken(user, refreshTokenValue);

    await this.storeRefreshToken(user.id, hashToken(refreshTokenValue));

    const isProduction =
      this.config.get("NODE_ENV", { infer: true }) === "production";

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: durationToMs(
        this.config.getOrThrow("JWT_ACCESS_EXPIRATION", { infer: true }),
      ),
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: durationToMs(
        this.config.getOrThrow("JWT_REFRESH_EXPIRATION", { infer: true }),
      ),
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.config.getOrThrow("JWT_SECRET", { infer: true }),
        expiresIn: this.config.getOrThrow("JWT_ACCESS_EXPIRATION", {
          infer: true,
        }),
      },
    );
  }

  private signRefreshToken(user: User, tokenValue: string): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        tokenValue,
      },
      {
        secret: this.config.getOrThrow("JWT_SECRET", { infer: true }),
        expiresIn: this.config.getOrThrow("JWT_REFRESH_EXPIRATION", {
          infer: true,
        }),
      },
    );
  }

  private async storeRefreshToken(
    userId: string,
    tokenHash: string,
  ): Promise<RefreshToken> {
    const expiresInMs = durationToMs(
      this.config.getOrThrow("JWT_REFRESH_EXPIRATION", { infer: true }),
    );
    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + expiresInMs),
      },
    });
  }

  private async deleteRefreshToken(tokenHash: string): Promise<void> {
    try {
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
    } catch {
      // Ignore if already deleted.
    }
  }
}
