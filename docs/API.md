# API Documentation

## Swagger

When the API is running, open `http://localhost:3001/api/docs` for interactive Swagger UI.

## Auth

The API uses JWT access tokens stored in `HttpOnly` cookies. Protected endpoints require the cookie.

## Base response format

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Errors follow NestJS global exception filter format:

```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

## Endpoints (summary)

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET  /auth/me`

### Users

- `GET /users/me`
- `PATCH /users/me`

### Products

- `GET /products` (search, filter, pagination)
- `GET /products/:id`
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)

### Reviews

- `GET /products/:productId/reviews`
- `POST /products/:productId/reviews`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`
- `POST /reviews/:id/vote`

### Search

- `GET /search?q=...&mode=fulltext|semantic|hybrid&target=products|reviews|all&limit=&offset=`

### Uploads

- `POST /uploads/signed-url` (for direct-to-MinIO uploads)

### Admin

- `GET /admin/reviews?status=PENDING`
- `PATCH /admin/reviews/:id/status`
- `DELETE /admin/reviews/:id`
- `GET /admin/users`
- `PATCH /admin/users/:id/role`

## Search modes

- `fulltext`: PostgreSQL `ts_rank_cd` over `searchVector`.
- `semantic`: cosine distance (`<=>`) between query embedding and stored embeddings.
- `hybrid`: reciprocal rank fusion of full-text and semantic results.
