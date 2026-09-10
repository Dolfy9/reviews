import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@product-reviews/shared";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtUser } from "../../common/types";
import { UserResponseDto } from "../../common/dto";

class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

@ApiTags("users")
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({
    status: 200,
    description: "Current user profile.",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user's profile" })
  @ApiResponse({
    status: 200,
    description: "Updated user profile.",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Not authenticated." })
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    const input: UpdateProfileInput = { name: dto.name };
    return this.usersService.updateProfile(user.userId, input);
  }
}
