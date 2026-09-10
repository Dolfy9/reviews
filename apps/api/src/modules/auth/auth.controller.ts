import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtUser } from "../../common/types";
import { RegisterDto, LoginDto } from "./dto";
import { UserResponseDto, MessageResponseDto } from "../../common/dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user account" })
  @ApiResponse({
    status: 201,
    description: "User registered, auth cookies set.",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Email already in use or invalid input.",
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Post("login")
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful, auth cookies set.",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials." })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Log out and clear auth cookies" })
  @ApiResponse({
    status: 200,
    description: "Logout successful.",
    type: MessageResponseDto,
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.refresh_token, res);
    return { message: "Logout successful" };
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token cookie" })
  @ApiResponse({
    status: 200,
    description: "New auth cookies set.",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired refresh token.",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req.cookies?.refresh_token, res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({
    status: 200,
    description: "Current user profile.",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.userId);
  }
}
