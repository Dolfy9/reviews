# Frontend Routing & State

## Routing

React Router 6 is used. Route definitions live in `apps/web/src/App.tsx`.

Routes:

| Path | Component | Auth | Description |
| ---- | --------- | ---- | ----------- |
| `/` | `Home` | Public | Product listing with search bar |
| `/products/:id` | `Product` | Public | Product detail with reviews and review form (if logged in) |
| `/login` | `Login` | Public | Login form with Zod validation |
| `/register` | `Register` | Public | Registration form with Zod validation |
| `/admin` | `Admin` | Admin | Pending review moderation dashboard |
| `*` | — | Public | Fallback 404 page |

## State

- **Server state**: TanStack Query (`react-query`). Query keys follow `["entity", id]` convention.
- **Auth state**: Zustand store in `apps/web/src/store/authStore.ts`, hydrated on mount via `useAuth` hook calling `/auth/me`.
- **Form state**: React Hook Form + Zod schemas from `@product-reviews/shared`.

## API client

`apps/web/src/api/client.ts` creates an Axios instance with `withCredentials: true` and `baseURL` from `VITE_API_URL` env (defaults to `http://localhost:3001/api`).

API modules in `apps/web/src/api/`:
- `auth.ts` — register, login, logout, me
- `products.ts` — list, get by ID
- `reviews.ts` — list by product, create, vote
- `admin.ts` — getReviews, updateReviewStatus, deleteReview
- `search.ts` — search

## Components

- `Layout.tsx` — nav bar with auth-aware links (login/register or username/admin/logout)
- `ProductCard.tsx` — product summary card with link to detail
- `ReviewCard.tsx` — review display with helpful/not-helpful voting (if logged in)
- `SearchBar.tsx` — controlled search input triggering callback on submit

## Error handling

- All pages display error states for failed queries (`isError` checks)
- Login and Register forms show inline submit errors
- Product review form shows success and error states for mutation
- Admin page shows error states for query and mutations
- ReviewCard vote failures are caught silently
