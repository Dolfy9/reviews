import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { APP_GUARD } from "@nestjs/core";
import { validate } from "./config/env.schema";
import { PrismaModule } from "./config/prisma.module";
import { RedisModule } from "./config/redis.module";
import { MinioModule } from "./config/minio.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SearchModule } from "./modules/search/search.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ validate, isGlobal: true }),
    EventEmitterModule.forRoot({ global: true }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    MinioModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    ReviewsModule,
    SearchModule,
    UploadsModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
