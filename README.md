# Threadfront: online store for clothing brands (by StackGlint)

A complete e-commerce store for fashion labels: storefront, checkout and a store admin. It's built once and re-branded per client: name, colours, fonts, products and photos.

> **Demo:** "Sora & Sand" is a fictional brand. People and emails are invented (example.com), products, prices and stock are sample data, and photos come from Unsplash. No payment is taken and nothing ships.

## Storefront

- **Home:** editorial hero, new arrivals, category tiles, a "most loved" grid and an announcement marquee.
- **Shop:**
  - Filters: collection, category, size in stock, colour family, price and on sale.
  - Sorting and search.
  - Filter state lives in the URL, so it can be shared and indexed.
  - A bottom-sheet filter panel on mobile.
- **Product cards:**
  - Hover shows the second photo.
  - Badges: new, sale % and low stock.
  - Colour dots and a desktop **quick add** by size.
- **Product page:**
  - Gallery with thumbnails, colourways with their own photos and size selection.
  - Stock state per size: sold-out sizes are disabled and low sizes say "Only 2 left".
  - Size guide, wishlist and details / fabric / delivery panels, plus related products.
- **Bag drawer:** quantity controls, a free-shipping progress bar and live stock warnings.
- **Checkout:**
  - Contact, then standard / express / pickup, then card (demo) or cash on delivery.
  - Discount codes are applied with clear messages (invalid, minimum spend, fully used).
- **Order page:** confirmation and a tracking timeline (Placed → Packed → Shipped → Delivered).
- **Wishlist:** saved in the browser.

## Store admin (`/admin`, demo login is pre-filled)

- **Overview:**
  - Revenue, orders and average order over 30 days vs the previous 30, plus today.
  - 14-day revenue chart, best sellers, low-stock list and recent orders.
- **Orders:**
  - Filter by status ("To fulfil" and so on) and search.
  - Order detail with items, customer, address and a status timeline.
  - One-click **Mark paid → packed → shipped → delivered**.
  - **Cancel** (before shipping) returns the units to stock automatically.
- **Products & stock:** edit price and sale ("was") price, stock per colour and size, and hide or show a product.
- **Customers:** order count, lifetime spend, average order and last order.
- **Discounts:** create percent or fixed codes with minimum spend and usage limits, pause or resume them, and see usage.
- **Reset demo data** button.

## Engineering

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript strict |
| UI | Tailwind CSS 4, Bodoni Moda + Inter Tight (self-hosted) |
| Data | PostgreSQL + Drizzle ORM. Zero-setup local mode with **PGlite** (the Postgres engine in WASM). |
| Validation | Zod at every server boundary |
| Auth | Signed httpOnly JWT cookie (jose), bcrypt, login throttling |
| Tests | Node test runner: domain unit tests + integration tests on a real Postgres engine |
| Ops | Multi-stage Dockerfile (non-root, standalone), docker compose with Postgres 17, GitHub Actions CI, `/api/health` |

**How it stays correct**
- **No overselling.**
  1. Checkout decrements stock with a conditional `UPDATE … SET stock = stock - qty WHERE stock >= qty`, inside one transaction.
  2. A `CHECK (stock >= 0)` constraint is the final guard.
  3. A test fires three orders at the last unit and expects exactly one to succeed.
- **The server is the source of truth for money.**
  - The bag stores only variant IDs and quantities. Prices, discounts and shipping are recalculated on the server from the database.
  - If the total changed after the shopper opened checkout, the order stops and shows the new total (`PRICE_CHANGED`).
- **Pure pricing rules** (`src/domain/pricing.ts`): subtotal, discount eligibility, a discount that never goes below zero, and the free-shipping threshold (applied after the discount). All of it is unit-tested.
- **History is immutable.** Order lines snapshot the name, colour, size, price and image, so editing a product never rewrites past orders.
- **The order status flow is enforced** in the domain (`canMove`). Cancelling restocks items and releases the discount use, in the same transaction.
- **Integrity in the schema:** check constraints (positive prices, sale price above price, order totals add up, valid discount values), unique SKUs, upper-case codes, lower-case emails, and a Postgres sequence for race-free order numbers.
- **Security:**
  - Inputs are validated, and SQL is parameterised (Drizzle).
  - The admin guard runs in every admin page and action.
  - Order pages use unguessable tokens (192-bit).
  - Security headers are set.
  - Card fields are a demo only: card details are never sent. A live store plugs in a provider such as Stripe.

```
src/
  domain/        pricing, order status rules, catalogue helpers (pure, no I/O)
  server/
    db/          schema, migrations runner, Postgres/PGlite switch, seed
    services/    catalog, checkout, orders, stats (use cases)
    actions/     thin, validated Server Actions for the shop and admin
    auth/        session + admin guard
  components/    storefront (bag, cards, product, checkout) and admin UI
  app/           routes: (shop) storefront, admin, api/health
drizzle/         SQL migrations
tests/           unit + integration tests
```

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, embedded Postgres in ./.data, demo data seeded automatically
npm test           # 14 tests (domain + checkout integration)
```

Use a real PostgreSQL: copy `.env.example` to `.env`, then set `DATABASE_URL` and `AUTH_SECRET`. Migrations run automatically. To reset the data, use the dashboard button or run `npm run db:reset`.

## Deploy

- **Docker:** `docker compose up --build` starts the app and Postgres 17 on port 3000. Set `AUTH_SECRET`.
- **Vercel + Neon (or Supabase):** set `DATABASE_URL` and `AUTH_SECRET`. Run `npm run db:migrate && npm run db:seed` once against the database before the first visit.
- CI runs lint, type-check, tests on embedded Postgres and on a real PostgreSQL 17 service, a production build and a Docker build.

## Re-branding for a client

1. Store name, currency and shipping rules: `src/server/db/seed-data.ts` (`STORE`), or the `store` table.
2. Colours and fonts: the `@theme` block in `src/app/globals.css`.
3. Products: import theirs (CSV/API), or add them through the admin once product creation is enabled for their plan.
4. Payments: connect Stripe, PayHere or another gateway in the checkout service.

---

Built by **StackGlint** · stackglintt@gmail.com
