import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Observable } from "rxjs";
import { AdminService } from "./admin.service";
import { DataFeedService, MiningProgressEvent } from "./data-feed.service";
import {
  UpdateReviewStatusDto,
  AdminReviewListQueryDto,
  UpdateRoleDto,
} from "./dto";
import { ReviewsService } from "../reviews/reviews.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { EventEmitter2 } from "@nestjs/event-emitter";

@ApiTags("admin")
@ApiCookieAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reviewsService: ReviewsService,
    private readonly dataFeedService: DataFeedService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get("reviews")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "List reviews for moderation (admin only)" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    description: "Filter by review status. Defaults to non-approved.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default 20, max 50)",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of reviews for moderation.",
  })
  @ApiResponse({ status: 403, description: "Admin role required." })
  getReviewsForModeration(
    @Query("status") status: string | undefined,
    @Query() query: AdminReviewListQueryDto,
  ) {
    return this.reviewsService.findPending(status, query);
  }

  @Patch("reviews/:id/status")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update a review's moderation status (admin only)" })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({ status: 200, description: "Review status updated." })
  @ApiResponse({ status: 404, description: "Review not found." })
  @ApiResponse({ status: 403, description: "Admin role required." })
  updateReviewStatus(
    @Param("id") reviewId: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(reviewId, dto);
  }

  @Delete("reviews/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Delete a review (admin only)" })
  @ApiParam({ name: "id", type: String, description: "Review ID" })
  @ApiResponse({ status: 200, description: "Review deleted." })
  @ApiResponse({ status: 404, description: "Review not found." })
  @ApiResponse({ status: 403, description: "Admin role required." })
  deleteReview(@Param("id") reviewId: string) {
    return this.reviewsService.delete(reviewId, "", true);
  }

  @Get("users")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "List all users (admin only)" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default 20, max 50)",
  })
  @ApiResponse({ status: 200, description: "Paginated list of users." })
  @ApiResponse({ status: 403, description: "Admin role required." })
  getUsers(@Query() query: AdminReviewListQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Patch("users/:id/role")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update a user's role (admin only)" })
  @ApiParam({ name: "id", type: String, description: "User ID" })
  @ApiResponse({ status: 200, description: "User role updated." })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({ status: 403, description: "Admin role required." })
  updateRole(@Param("id") userId: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(userId, dto.role);
  }

  @Get("stats")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Get database statistics (admin only)" })
  @ApiResponse({ status: 200, description: "Database statistics." })
  async getStats() {
    return this.dataFeedService.getStats();
  }

  @Post("seed")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Mine real products from web sources (admin only)" })
  @ApiQuery({
    name: "source",
    required: false,
    type: String,
    description:
      "Source: off, itunes_movies, itunes_podcasts, itunes_apps, openlibrary, or all (default all)",
  })
  @ApiQuery({
    name: "count",
    required: false,
    type: Number,
    description: "Products per source (default 100, max 100)",
  })
  @ApiResponse({ status: 201, description: "Products mined successfully." })
  @ApiResponse({ status: 403, description: "Admin role required." })
  async seedProducts(
    @Query("source") source?: string,
    @Query("count") count?: string,
  ) {
    const src = (source ?? "all") as
      | "off"
      | "itunes_movies"
      | "itunes_podcasts"
      | "itunes_apps"
      | "openlibrary"
      | "all";
    const n = count ? Math.min(parseInt(count, 10) || 100, 100) : 100;
    return this.dataFeedService.seed(src, n);
  }

  @Sse("seed-stream")
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Mine products with real-time SSE progress stream (admin only)",
  })
  @ApiQuery({
    name: "source",
    required: false,
    type: String,
    description:
      "Source: off, itunes_movies, itunes_podcasts, itunes_apps, openlibrary, or all (default all)",
  })
  @ApiQuery({
    name: "count",
    required: false,
    type: Number,
    description: "Products per source (default 100, max 100)",
  })
  seedStream(
    @Query("source") source?: string,
    @Query("count") count?: string,
  ): Observable<MessageEvent> {
    const src = (source ?? "all") as
      | "off"
      | "itunes_movies"
      | "itunes_podcasts"
      | "itunes_apps"
      | "openlibrary"
      | "all";
    const n = count ? Math.min(parseInt(count, 10) || 100, 100) : 100;

    return new Observable<MessageEvent>((subscriber) => {
      const handler = (event: MiningProgressEvent) => {
        subscriber.next({ data: event } as MessageEvent);
        if (event.step === "complete") {
          subscriber.complete();
        }
      };

      this.eventEmitter.on("mining.progress", handler);

      this.dataFeedService.seed(src, n).catch((err) => {
        subscriber.next({
          data: {
            step: "source_error",
            message: `Fatal error: ${err}`,
            timestamp: new Date().toISOString(),
          },
        } as MessageEvent);
        subscriber.complete();
      });

      return () => {
        this.eventEmitter.off("mining.progress", handler);
      };
    });
  }
}
