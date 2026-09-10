import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import type { ExecutionContext } from "@nestjs/common";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);
    if (result instanceof Observable) {
      return result.pipe(catchError(() => of(true)));
    }
    if (typeof result === "boolean") {
      return result;
    }
    return result.catch(() => true);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user as TUser;
  }
}
