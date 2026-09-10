# Frontend Routing & State

## Routing

React Router 6 is used. Route definitions live in `apps/web/src/App.tsx`.

Routes:

| Path            | Component  | Auth   | Description                                                                                       |
| --------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------- |
| `/`             | `Home`     | Public | Product listing with search bar                                                                   |
| `/products/:id` | `Product`  | Public | Product detail with reviews, review form (if logged in), image lightbox, and review image gallery |
| `/login`        | `Login`    | Public | Login form with Zod validation                                                                    |
| `/register`     | `Register` | Public | Registration form with Zod validation                                                             |
| `/admin`        | `Admin`    | Admin  | Review moderation, user management, database stats, and live data-mining dashboard                |
| `*`             | —          | Public | Fallback 404 page                                                                                 |

## State

- **Server state**: TanStack Query (`react-query`). Query keys follow `["entity", id]` convention.
- **Auth state**: Zustand store in `apps/web/src/store/authStore.ts`, hydrated on mount via `useAuth` hook calling `/auth/me`.
- **Form state**: React Hook Form + Zod schemas from `@product-reviews/shared`. The review form uses `watch`/`setValue` for rating, images, and pros/cons arrays.

## API client

`apps/web/src/api/client.ts` creates an Axios instance with `withCredentials: true` and `baseURL` from `VITE_API_URL` env (defaults to `http://localhost:3001/api`).

API modules in `apps/web/src/api/`:

- `auth.ts` — register, login, logout, me
- `products.ts` — list, get by ID
- `reviews.ts` — list by product, `checkMine` (current user's review for a product), create, vote
- `admin.ts` — getReviews, updateReviewStatus, deleteReview
- `search.ts` — search
- `uploads.ts` — get presigned URL for direct image upload

## Components

- `Layout.tsx` — nav bar with auth-aware links, dark-mode toggle, and an "API docs" link to Swagger
- `AutocompleteSearch.tsx` — debounced search input with live fulltext suggestions and "see all results" action
- `ProductCard.tsx` — product summary card with image, rating, price, and link to detail
- `SearchBar.tsx` — controlled search input triggering callback on submit
- `StarRating.tsx` — read-only or interactive star rating component
- `ReviewCard.tsx` — review display with star rating, author, pros/cons, image gallery, helpful/not-helpful voting, and edit/delete actions for the owner/admin
- `ReviewImageGallery.tsx` — thumbnail grid and full-screen lightbox for a review's images
- `ReviewImageInput.tsx` — image attachment input that fetches a presigned URL and uploads directly to MinIO
- `ProsConsInput.tsx` — tag-style inputs for adding pros and cons to a review
- `Skeletons.tsx` — loading skeletons for product grids, cards, and lists
- `EmptyState.tsx` — empty/error state with optional action
- `Toast.tsx` — global toast notifications via `ToastProvider`

## Error handling

- All pages display error states for failed queries (`isError` checks)
- Login and Register forms show inline submit errors
- Product review form shows success and error states for mutation, and an "already reviewed" banner instead of the form when `checkMine` returns a review
- Admin page shows error states for query and mutations
- ReviewCard vote failures show an inline error message and a spinner on the active button
- Search/autocomplete query failures fall back to an empty suggestions list
