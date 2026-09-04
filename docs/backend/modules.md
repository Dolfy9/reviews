# Backend Module Conventions

Each feature module lives in `apps/api/src/modules/<feature>/` and follows this structure:

```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── dto/
│   └── index.ts
├── guards/
│   └── *.guard.ts (if needed)
├── strategies/
│   └── *.strategy.ts (if needed)
└── <feature>.spec.ts
```

## Rules

- Controllers handle HTTP concerns only: routing, status codes, guards, DTOs.
- Services contain business rules and orchestrate repositories.
- Repositories contain Prisma queries and are the only files that import `@prisma/client` (exception: services may use `PrismaService.$transaction` for atomic multi-table operations).
- DTOs re-export Zod schemas from `@product-reviews/shared` via `createZodDto` or define local Nest-specific DTOs.
- Use `ZodValidationPipe` globally (configured in `main.ts`) to validate request DTOs.
- Controllers use Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`, `@ApiCookieAuth`) for OpenAPI documentation.
- Never call Prisma directly from controllers.
