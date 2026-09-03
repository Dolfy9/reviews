import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@product-reviews/shared";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtUser } from "../../common/types";

class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch("me")
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    const input: UpdateProfileInput = { name: dto.name };
    return this.usersService.updateProfile(user.userId, input);
  }
}
