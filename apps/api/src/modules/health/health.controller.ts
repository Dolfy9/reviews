import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { PrismaHealthIndicator } from "@nestjs/terminus";
import { PrismaService } from "../../config/prisma.service";
import { HealthCheckResponseDto } from "../../common/dto";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({
    status: 200,
    description: "Service health status including database connectivity.",
    type: HealthCheckResponseDto,
  })
  check() {
    return this.health.check([
      () => this.prisma.pingCheck("database", this.prismaService),
    ]);
  }
}
