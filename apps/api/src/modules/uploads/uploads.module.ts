import { Module } from "@nestjs/common";
import { MinioModule } from "../../config/minio.module";
import { AuthModule } from "../auth/auth.module";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [MinioModule, AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
