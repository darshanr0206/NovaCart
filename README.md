# NovaCart
### Multi-Vendor E-Commerce Marketplace
*"Many Sellers. One Cart."*

NovaCart is a full-stack, multi-vendor marketplace: independent sellers list and manage
products, customers browse/buy/track/return, admins approve sellers and oversee the
platform, and delivery partners manage assigned deliveries.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA / Hibernate, Maven |
| Database | PostgreSQL |
| Payments | Razorpay (server-verified) |
| Media | Cloudinary |
| Email | Resend |
| Docs | springdoc-openapi (Swagger UI) |

Deliberately excluded per spec: NestJS/Node backend, Prisma, MongoDB, Docker, Kubernetes,
Kafka, microservices, Redis, Elasticsearch. This is a clean monolith:

```
Next.js → REST (JSON over HTTPS) → Spring Boot → Spring Data JPA → Hibernate → PostgreSQL
                                          │
                                          ├── Razorpay   (payments)
                                          ├── Cloudinary (images)
                                          └── Resend     (transactional email)
```

## 2. Repository layout

```
novacart/
├── backend/     Spring Boot API — see backend/README.md
└── frontend/    Next.js app     — see frontend/README.md
```

## 3. Quick start

```bash
# 1. Database
createdb novacart

# 2. Backend
cd backend
cp .env.example .env        # fill in DB creds at minimum; payment/media/email keys optional
export $(cat .env | xargs)
mvn spring-boot:run         # http://localhost:8080

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Log in as the admin (`administrator@novacart.app` / `Administrator@2026!`) to approve sellers,
or register as a new customer and apply to become a seller from the header's
"Become a Seller" link.

## 4. Database design

20 core entities, normalized with proper FKs/unique constraints/timestamps:

`User` (roles: CUSTOMER/SELLER/ADMIN/DELIVERY_PARTNER) → `Seller` → `Product` → `Category`,
`ProductImage`, `Inventory` · `Cart` → `CartItem` · `Wishlist` → `WishlistItem` ·
`Order` → `OrderItem`, `Payment` · `Review` · `Coupon` · `ReturnRequest` · `Delivery` ·
`Address` · `Notification`.

Full field-level detail is in the entity classes under
`backend/src/main/java/com/novacart/entity/`.

## 5. API documentation

Once the backend is running: `http://localhost:8080/swagger-ui.html`.
Every endpoint from the original spec (`/api/auth/**`, `/api/products/**`,
`/api/categories/**`, `/api/cart/**`, `/api/orders/**`, `/api/payments/**`,
`/api/sellers/**`, `/api/reviews`, `/api/admin/**`, `/api/delivery/**`) is implemented and
documented there, plus `/api/wishlist` and `/api/addresses` which the spec's data model
implied but the endpoint list omitted.

## 6. Security

JWT access + refresh tokens, BCrypt password hashing, role-based route authorization
enforced both at the Spring Security filter-chain level (`SecurityConfig`) and per-method
(`@PreAuthorize`). Razorpay payments are verified server-side via HMAC-SHA256 signature —
the frontend's "payment succeeded" callback is never trusted on its own.

## 7. Deployment

- **Frontend → Vercel**: import the `frontend/` folder as the project root, set
  `NEXT_PUBLIC_API_BASE_URL` to your deployed backend's `/api` URL.
- **Backend → Railway or Render**: deploy `backend/` (both platforms auto-detect Maven/Java),
  attach a managed PostgreSQL instance, set the environment variables listed in
  `backend/README.md` in the platform's dashboard.
- **Database → Railway/Render PostgreSQL** add-on, or any managed Postgres.

## 8. What's fully built vs. what's scaffolded for extension

This ships as a genuinely working core, not a mockup — you can register, browse, add to
cart, check out through Razorpay, track an order, and — as an approved seller — list
products, or — as an admin — approve sellers, end to end.

A handful of admin/seller sub-pages (coupon management, returns approval, seller
order-processing UI, analytics charts) follow the exact same pattern as the pages that
*are* built (e.g. `app/admin/sellers/page.tsx`) and are called out explicitly in
`backend/README.md` and `frontend/README.md` as the fastest next additions, rather than
being padded out with placeholder screens here.

## 9. Git

```bash
git init
git add .
git commit -m "feat: initial NovaCart scaffold — auth, catalog, cart, orders, payments, seller/admin approval flow"
```

`.gitignore` files are already in place in both `backend/` and `frontend/` — `.env`,
`target/`, `node_modules/`, and `.next/` are excluded so no secrets or build artifacts get
committed.
