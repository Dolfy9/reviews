# Frontend Routing & State

## Routing

React Router 6 is used. Route definitions live in `apps/web/src/router.tsx`.

Planned routes:

- `/` – product listing with search
- `/products/:id` – product detail with reviews
- `/login` / `/register` – auth pages
- `/admin` – admin dashboard (protected, admin role)
- `/admin/products` – product management
- `/admin/reviews` – review moderation

## State

- **Server state**: TanStack Query (`react-query`).
- **Auth state**: Zustand store hydrated from `/auth/me`.
- **Form state**: React Hook Form + Zod schemas from `@product-reviews/shared`.

## API client

`apps/web/src/lib/api.ts` creates an Axios instance with `withCredentials: true` and request/response interceptors for auth errors.
