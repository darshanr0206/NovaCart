# NovaCart Backend

Java 21 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA / Hibernate · PostgreSQL · Maven

## Setup

1. **PostgreSQL** — create a database:
   ```sql
   CREATE DATABASE novacart;
   ```

2. **Environment variables** — copy `.env.example` and fill in real values, or export
   the variables directly (Railway/Render both support setting these in their dashboard):
   ```bash
   cp .env.example .env
   ```
   Spring Boot does not read `.env` files natively — either `export $(cat .env | xargs)`
   before running locally, or use an IDE run configuration / a tool like `direnv`.

3. **Run locally**:
   ```bash
   ./mvnw spring-boot:run
   ```
   (or `mvn spring-boot:run` if you have Maven installed globally — no wrapper jar is
   bundled in this export, so run `mvn -N io.takari:maven:wrapper` once to generate one,
   or just use your local `mvn`.)

   The API starts on `http://localhost:8080`. Swagger UI is at
   `http://localhost:8080/swagger-ui.html`.

4. **First boot** seeds:
   - Starter categories (Electronics, Fashion, Home, Beauty, Groceries, Sports, Books, Automotive)
   - An admin account: `admin@novacart.app` / `ChangeMe123!` — **change this immediately**
     in any real deployment (`DataSeeder.java`).

## Tests

```bash
mvn test
```

Runs against an in-memory H2 database (`src/test/resources/application-test.yml`) so no
PostgreSQL instance is needed for `AuthControllerTest`.

## Environment variables reference

| Variable | Purpose |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | HMAC signing key for access/refresh tokens — use a long random value |
| `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` | Token lifetimes in ms |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | From the Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From the Cloudinary dashboard |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | From the Resend dashboard |

If Razorpay/Cloudinary/Resend keys are left blank, those integrations degrade gracefully:
payments skip straight to "order placed, pending payment", uploads will fail with a clear
error, and emails are logged instead of sent — none of it crashes the app.

## What's implemented vs. scaffolded

**Fully implemented and working end-to-end:**
Auth (register/login/JWT/RBAC/forgot-reset password), product catalog + search/filter/sort,
categories, cart, addresses, checkout → order creation with real inventory locking,
Razorpay order-create + signature-verified payment confirmation, seller registration →
admin approval workflow, seller product CRUD, reviews with live rating recalculation,
wishlist, delivery-partner status updates, admin dashboard stats, Cloudinary image
upload, Resend transactional emails, global exception handling, one integration test.

**Modeled but with thinner coverage — extend as needed:**
- Coupons: entity + repository + order-time validation exist; no admin CRUD endpoints yet
  (add a `CouponController` mirroring `AdminController`'s style).
- Returns/refunds: `ReturnRequest` entity + repository exist; no controller yet — add
  `POST /api/orders/{id}/return` and an admin approve/reject flow.
- Notifications: entity + repository exist, nothing publishes to it yet.
- Delivery assignment: partners can update status on deliveries already assigned to them,
  but there's no admin "assign this order to this partner" endpoint yet.

These are straightforward additions following the exact same
controller → service → repository pattern used everywhere else in this codebase.
