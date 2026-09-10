# API Documentation

## Swagger

When the API is running, open `http://localhost:3001/api/docs` for interactive Swagger UI.
All endpoints are tagged by module (auth, users, products, reviews, search, uploads, admin, health) and include full parameter descriptions, response codes, and cookie auth requirements.

## Authentication

The API uses JWT access tokens stored in `HttpOnly` cookies (`access_token`).
A refresh token (`refresh_token`) is also set as an `HttpOnly` cookie.

- **Public endpoints**: no cookie required.
- **Authenticated endpoints**: require `access_token` cookie. Returns `401` if missing/expired.
- **Admin endpoints**: require `access_token` cookie with `ADMIN` role. Returns `403` if unauthorized.
- **Token refresh**: call `POST /auth/refresh` with the `refresh_token` cookie to get new tokens.

## Base URL

All endpoints are prefixed with `/api` (e.g. `http://localhost:3001/api/products`).

## Paginated response format

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Error format

```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

## Endpoints

### Auth (`/api/auth`)

| Method | Path             | Auth             | Description                                                                                    |
| ------ | ---------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `POST` | `/auth/register` | Public           | Register a new user. Body: `{ email, password, name? }`. Sets auth cookies. Returns `UserDto`. |
| `POST` | `/auth/login`    | Public           | Log in. Body: `{ email, password }`. Sets auth cookies. Returns `UserDto`.                     |
| `POST` | `/auth/logout`   | Cookie           | Clears auth cookies and deletes refresh token.                                                 |
| `POST` | `/auth/refresh`  | Cookie (refresh) | Refreshes access token using `refresh_token` cookie. Returns `UserDto`.                        |
| `GET`  | `/auth/me`       | Cookie           | Returns current authenticated user profile.                                                    |

### Users (`/api/users`)

| Method  | Path        | Auth   | Description                                                          |
| ------- | ----------- | ------ | -------------------------------------------------------------------- |
| `GET`   | `/users/me` | Cookie | Get current user's profile. Returns `UserDto`.                       |
| `PATCH` | `/users/me` | Cookie | Update current user's profile. Body: `{ name? }`. Returns `UserDto`. |

### Products (`/api/products`)

| Method   | Path            | Auth   | Description                                                                                |
| -------- | --------------- | ------ | ------------------------------------------------------------------------------------------ |
| `GET`    | `/products`     | Public | List products with pagination, search, filter, and sort. Query params below.               |
| `GET`    | `/products/:id` | Public | Get a single product by ID. Returns `ProductDto`.                                          |
| `POST`   | `/products`     | Admin  | Create a new product. Body: `{ name, description?, price, category, images?, isActive? }`. |
| `PATCH`  | `/products/:id` | Admin  | Update a product. Body: partial `CreateProductInput`.                                      |
| `DELETE` | `/products/:id` | Admin  | Delete a product.                                                                          |

#### `GET /products` query parameters

| Parameter   | Type   | Required | Default  | Description                                                      |
| ----------- | ------ | -------- | -------- | ---------------------------------------------------------------- |
| `page`      | number | No       | `1`      | Page number                                                      |
| `limit`     | number | No       | `20`     | Items per page (max 100)                                         |
| `sort`      | enum   | No       | `newest` | One of: `newest`, `rating`, `reviews`, `price_asc`, `price_desc` |
| `category`  | string | No       | —        | Filter by category                                               |
| `minRating` | number | No       | —        | Minimum average rating (0–5)                                     |
| `search`    | string | No       | —        | Search term for name and description                             |

### Reviews (`/api/reviews`)

| Method   | Path                                   | Auth   | Description                                                                                                                                                        |
| -------- | -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/reviews/products/:productId/reviews` | Public | List approved reviews for a product. Query: `page`, `limit` (max 50).                                                                                              |
| `GET`    | `/reviews/products/:productId/mine`    | Cookie | Returns the current user's review for the product, or `null` if none.                                                                                              |
| `POST`   | `/reviews/products/:productId/reviews` | Cookie | Create a review. Body: `{ rating (1-5), title, content, images?, pros?, cons? }`. `images`, `pros`, and `cons` are string arrays. One review per user per product. |
| `PATCH`  | `/reviews/:id`                         | Cookie | Update a review (owner or admin). Body: partial `CreateReviewInput`.                                                                                               |
| `DELETE` | `/reviews/:id`                         | Cookie | Delete a review (owner or admin).                                                                                                                                  |
| `POST`   | `/reviews/:id/vote`                    | Cookie | Vote on a review. Body: `{ type: "HELPFUL"                                                                                                                         | "NOT_HELPFUL" }`. Toggles if same vote type. |

### Search (`/api/search`)

| Method | Path      | Auth   | Description                     |
| ------ | --------- | ------ | ------------------------------- |
| `GET`  | `/search` | Public | Search products and/or reviews. |

#### Query parameters

| Parameter | Type   | Required | Default    | Description                              |
| --------- | ------ | -------- | ---------- | ---------------------------------------- |
| `q`       | string | Yes      | —          | Search query (1–200 chars)               |
| `mode`    | enum   | No       | `fulltext` | One of: `fulltext`, `semantic`, `hybrid` |
| `target`  | enum   | No       | `products` | One of: `products`, `reviews`, `all`     |
| `page`    | number | No       | `1`        | Page number                              |
| `limit`   | number | No       | `20`       | Items per page (max 50)                  |

When `target=all`, response is `{ products: PaginatedResponse<ProductDto>, reviews: PaginatedResponse<ReviewDto> }`.

### Uploads (`/api/uploads`)

| Method | Path                     | Auth   | Description                                                                                                           |
| ------ | ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/uploads/presigned-url` | Cookie | Get a presigned URL for direct-to-MinIO upload. Body: `{ filename }`. Returns `{ uploadUrl, publicUrl, objectName }`. |

### Admin (`/api/admin`)

All admin endpoints require `ADMIN` role.

| Method   | Path                        | Description                                                                                                                |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/admin/reviews`            | List reviews for moderation. Query: `status` (`PENDING`/`APPROVED`/`REJECTED`), `page`, `limit`. Defaults to non-approved. |
| `PATCH`  | `/admin/reviews/:id/status` | Update review status. Body: `{ status: "APPROVED"                                                                          | "REJECTED" }`. |
| `DELETE` | `/admin/reviews/:id`        | Delete any review.                                                                                                         |
| `GET`    | `/admin/users`              | List all users. Query: `page`, `limit`.                                                                                    |
| `PATCH`  | `/admin/users/:id/role`     | Update user role. Body: `{ role: "USER"                                                                                    | "ADMIN" }`.    |
| `GET`    | `/admin/stats`              | Database statistics overview.                                                                                              |
| `POST`   | `/admin/seed`               | Mine real products from configured sources. Query: `source?`, `count?`.                                                    |
| `GET`    | `/admin/seed-stream`        | SSE stream of mining progress. Query: `source?`, `count?`.                                                                 |

### Health (`/api/health`)

| Method | Path      | Auth   | Description                                         |
| ------ | --------- | ------ | --------------------------------------------------- |
| `GET`  | `/health` | Public | Health check. Returns database connectivity status. |

## Search modes

- **`fulltext`**: PostgreSQL `ts_rank_cd` over `to_tsvector('english', name || ' ' || description)`. Uses `plainto_tsquery` for query parsing.
- **`semantic`**: Cosine distance (`<=>`) between query embedding (384-dim BAAI/bge-small-en-v1.5) and stored embeddings. Requires `SEMANTIC_SEARCH_ENABLED=true`.
- **`hybrid`**: Reciprocal rank fusion (RRF, k=60) of full-text and semantic results. Fetches top 100 from each, fuses, then paginates.

## DTO schemas

All request/response schemas are defined with Zod in `packages/shared/src/schemas/` and shared between frontend and backend. See the Swagger UI for the full schema definitions.

## Rate limiting

All endpoints are rate-limited to 100 requests per 60 seconds per IP via `@nestjs/throttler`.
