import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { Env } from "../../../config/env.schema";
import { JwtUser } from "../../../common/types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request | undefined) => {
          const token = request?.cookies?.access_token;
          return typeof token === "string" ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow("JWT_SECRET", { infer: true }),
    });
  }

  validate(payload: { sub: string; email: string; role: string }): JwtUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as JwtUser["role"],
    };
  }
}
