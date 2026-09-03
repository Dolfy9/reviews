import { Controller, Post, Body } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { presignedUrlRequestSchema } from "@product-reviews/shared";
import { UploadsService } from "./uploads.service";

class PresignedUrlRequestDto extends createZodDto(presignedUrlRequestSchema) {}

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("presigned-url")
  async getPresignedUrl(@Body() dto: PresignedUrlRequestDto) {
    return this.uploadsService.getPresignedUrl(dto.filename);
  }
}
