import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { presignedUrlRequestSchema } from "@product-reviews/shared";
import { UploadsService } from "./uploads.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PresignedUrlResponseDto } from "../../common/dto";

class PresignedUrlRequestDto extends createZodDto(presignedUrlRequestSchema) {}

@ApiTags("uploads")
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("presigned-url")
  @ApiCookieAuth()
  @ApiOperation({
    summary: "Get a presigned URL for direct-to-MinIO file upload",
  })
  @ApiResponse({
    status: 200,
    description: "Returns uploadUrl, publicUrl, and objectName.",
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: "Filename is required." })
  async getPresignedUrl(@Body() dto: PresignedUrlRequestDto) {
    return this.uploadsService.getPresignedUrl(dto.filename);
  }
}
