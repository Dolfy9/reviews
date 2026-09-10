import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client as MinioClient } from "minio";
import { randomUUID } from "node:crypto";
import { Env } from "./env.schema";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: MinioClient;
  private readonly publicClient: MinioClient;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService<Env>) {
    const endpoint = this.config.getOrThrow("MINIO_ENDPOINT");
    const [host, portStr] = endpoint.split(":");
    if (!host || !portStr) {
      throw new Error("MINIO_ENDPOINT must be in host:port format");
    }
    const port = Number(portStr);
    this.bucket = this.config.getOrThrow("MINIO_BUCKET");
    this.publicUrl = this.config
      .getOrThrow("MINIO_PUBLIC_URL")
      .replace(/\/$/, "");

    this.client = new MinioClient({
      endPoint: host,
      port,
      useSSL: this.config.getOrThrow("MINIO_USE_SSL"),
      accessKey: this.config.getOrThrow("MINIO_ACCESS_KEY"),
      secretKey: this.config.getOrThrow("MINIO_SECRET_KEY"),
    });

    // A separate client configured with the public endpoint is used only to
    // sign presigned PUT URLs. It does not need to be reachable from the API
    // container; the browser uses the resulting URL to upload directly to MinIO.
    const publicEndpoint = new URL(this.publicUrl);
    const publicPort = publicEndpoint.port
      ? Number(publicEndpoint.port)
      : publicEndpoint.protocol === "https:"
        ? 443
        : 80;
    this.publicClient = new MinioClient({
      endPoint: publicEndpoint.hostname,
      port: publicPort,
      useSSL: publicEndpoint.protocol === "https:",
      accessKey: this.config.getOrThrow("MINIO_ACCESS_KEY"),
      secretKey: this.config.getOrThrow("MINIO_SECRET_KEY"),
      region: "us-east-1",
      pathStyle: true,
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created MinIO bucket: ${this.bucket}`);
    }
  }

  async getPresignedUploadUrl(extension?: string, expirySeconds = 300) {
    const objectName = `${randomUUID()}${extension ? `.${extension}` : ""}`;
    const uploadUrl = await this.publicClient.presignedPutObject(
      this.bucket,
      objectName,
      expirySeconds,
    );
    return {
      uploadUrl,
      publicUrl: `${this.publicUrl}/${this.bucket}/${objectName}`,
      objectName,
    };
  }
}
