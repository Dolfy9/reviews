import { Injectable, BadRequestException } from "@nestjs/common";
import { MinioService } from "../../config/minio.service";

@Injectable()
export class UploadsService {
  constructor(private readonly minioService: MinioService) {}

  async getPresignedUrl(filename: string) {
    if (!filename) {
      throw new BadRequestException("filename is required");
    }

    const extension = filename.includes(".")
      ? (filename.split(".").pop() ?? undefined)
      : undefined;

    return this.minioService.getPresignedUploadUrl(extension, 300);
  }
}
