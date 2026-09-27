# NovaCart Frontend

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs on `http://localhost:3000`. Requires the backend running on `http://localhost:8080`
(or set `NEXT_PUBLIC_API_BASE_URL` to point elsewhere).

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Spring Boot API, e.g. `http://localhost:8080/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional — the Razorpay Checkout key is actually returned by the backend's `/payments/create` response, so this is only a fallback/reference |

## Structure

- `app/` — Next.js App Router pages (customer, seller, admin, delivery routes)
- `components/` — shared UI (layout, home sections, product cards, status badges)
- `services/` — one file per backend resource, thin wrappers around `lib/api.ts` (axios)
- `store/` — Zustand stores for auth session and cart state (persisted to `localStorage`)
- `types/` — shared TypeScript interfaces mirroring the backend DTOs

## Design system

Apple-inspired, original NovaCart branding — not a clone:
- **Palette**: off-white (`cream`) background, white surfaces, soft gray (`mist`) sections,
  ink-black text, a single purple accent (`nova-500` / `#7C3AED`) used sparingly for CTAs,
  links, and the ✦ logo mark.
- **Type**: Manrope for display/headings, Inter for body — both loaded via `next/font/google`.
- Tokens live in `tailwind.config.ts`; base styles and reusable classes (`.card`,
  `.btn-primary`, `.btn-secondary`) live in `app/globals.css`.

## Pages implemented

Home (hero → categories → featured → deals → trust → recommended), product listing with
filters/sort, product detail with add-to-cart/buy-now, cart, checkout (address selection +
Razorpay Checkout.js integration with server-verified payment), orders list + detail with
a visual tracking stepper and cancel action, wishlist, profile, login/register/forgot-password,
seller registration + dashboard + product list + add-product form, admin dashboard + seller
approval queue, delivery partner dashboard with status advancement.

## Extending

Pages for admin product/order/category/coupon/return management and seller order
processing/inventory/analytics were intentionally left for you to add — the backend
already exposes (or can trivially expose, following the existing controller patterns)
everything needed. Copy the shape of `app/admin/sellers/page.tsx` or
`app/seller/products/page.tsx` for the fastest path to a matching page.
