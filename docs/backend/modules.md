# Backend Module Conventions

Each feature module lives in `apps/api/src/modules/<feature>/` and follows this structure:

```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── dto/
│   └── *.dto.ts
├── entities/
│   └── *.entity.ts
├── guards/
│   └── *.guard.ts (if needed)
├── strategies/
│   └── *.strategy.ts (if needed)
└── <feature>.spec.ts
```

## Rules

- Controllers handle HTTP concerns only: routing, status codes, guards, DTOs.
- Services contain business rules and orchestrate repositories.
- Repositories contain Prisma queries and are the only files that import `@prisma/client`.
- DTOs re-export Zod schemas from `@product-reviews/shared` or define local Nest-specific DTOs.
- Use `ZodValidationPipe` to validate request DTOs.
- Never call Prisma directly from controllers or services.
