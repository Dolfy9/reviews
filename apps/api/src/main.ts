import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ZodValidationPipe, patchNestJsSwagger } from "nestjs-zod";
import { AppModule } from "./app.module";
import { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });
  const config = app.get<ConfigService<Env>>(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow("CORS_ORIGIN", { infer: true }),
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix("/api");
  app.useGlobalPipes(new ZodValidationPipe());

  patchNestJsSwagger();
  const swagger = new DocumentBuilder()
    .setTitle("Product Reviews API")
    .setDescription("REST API for product reviews platform")
    .setVersion("0.0.1")
    .addCookieAuth("access_token")
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get("PORT", { infer: true }) ?? 3001;
  await app.listen(port, "0.0.0.0");
  Logger.log(`API running on http://localhost:${port}/api`, "Bootstrap");
}
void bootstrap();
