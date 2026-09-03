import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import {
  UpdateReviewStatusDto,
  AdminReviewListQueryDto,
  UpdateRoleDto,
} from "./dto";
import { ReviewsService } from "../reviews/reviews.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get("reviews")
  @Roles(Role.ADMIN)
  getReviewsForModeration(
    @Query("status") status: string | undefined,
    @Query() query: AdminReviewListQueryDto,
  ) {
    return this.reviewsService.findPending(status, query);
  }

  @Patch("reviews/:id/status")
  @Roles(Role.ADMIN)
  updateReviewStatus(
    @Param("id") reviewId: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(reviewId, dto);
  }

  @Delete("reviews/:id")
  @Roles(Role.ADMIN)
  deleteReview(@Param("id") reviewId: string) {
    return this.reviewsService.delete(reviewId, "", true);
  }

  @Get("users")
  @Roles(Role.ADMIN)
  getUsers(@Query() query: AdminReviewListQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Patch("users/:id/role")
  @Roles(Role.ADMIN)
  updateRole(@Param("id") userId: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(userId, dto.role);
  }
}
