# SHARKONE — Pending Features List

> **Generated:** 2025-07  ·  **Project:** sharkone-ecommerce (Next.js 16 + TypeScript + Tailwind 4 + Prisma/SQLite)
> **Current scope:** 25 pages, 86 API routes, 50+ UI components, ~40 Prisma models

---

## How to Read This Document

| Field | Meaning |
|---|---|
| **Priority** | `P0` = Critical/blocking · `P1` = High · `P2` = Medium · `P3` = Low/nice-to-have |
| **Status** | `Not Started` · `Partial` (some scaffolding exists) · `In Progress` (actively being worked on) |
| **Complexity** | `S` = Small (< 1 day) · `M` = Medium (1–3 days) · `L` = Large (1–2 weeks) · `XL` = Extra-Large (2–4+ weeks) |

---

## 1. Payment Gateway Integration

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 1.1 | M-Pesa STK Push (Daraja API) | **P0** | Not Started | L | Daraja sandbox/production credentials, business short code |
| 1.2 | Card payments (Flutterwave / Stripe) | **P0** | Not Started | L | Flutterwave/Stripe merchant account, webhook endpoint |
| 1.3 | Payment webhooks (idempotent) | **P0** | Not Started | M | Payment provider SDK |
| 1.4 | Payment retry / failed-payment recovery | P1 | Not Started | M | 1.1 or 1.2 |
| 1.5 | Refund-to-original-method | P1 | Not Started | M | 1.1 or 1.2 |
| 1.6 | Google OAuth / social login | P2 | Not Started | S | Google Cloud Console credentials, NextAuth config |

**Notes:** The checkout UI (`/checkout`) collects M-Pesa phone and card details, but `handlePlaceOrder` (line 1187) creates the order via `POST /api/orders` with zero real payment processing. The order creation endpoint (`src/app/api/orders/route.ts`) sets `paymentStatus: 'PENDING'` for non-wallet methods and never calls any payment provider. Google sign-in button exists in `/login` (line 235) but only shows `toast.info('Google sign-in coming soon')`.

---

## 2. HoneyCoin Wallet System (Buyer Digital Wallet)

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 2.1 | Buyer wallet model (Prisma) | P1 | Not Started | S | Schema migration |
| 2.2 | Wallet top-up via M-Pesa | **P0** | Not Started | L | 1.1 |
| 2.3 | Wallet-to-wallet transfers | P2 | Not Started | M | 2.1 |
| 2.4 | Cashback rewards on wallet payments | P2 | Not Started | M | 2.1 |
| 2.5 | Wallet transaction history page | P1 | Not Started | S | 2.1 |
| 2.6 | Wallet balance in Navbar | P1 | Not Started | S | 2.1 |

**Notes:** A `Wallet` model exists in Prisma but it is **seller-only** (tracks earnings, withdrawals, pending clearance). There is no buyer wallet / HoneyCoin system. The checkout UI already has a `wallet` payment option but it's non-functional for buyers.

---

## 3. Third-Party Logistics (3PL) Integration

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 3.1 | Courier abstraction layer / adapter pattern | P1 | Not Started | L | None |
| 3.2 | G4S courier integration | P1 | Not Started | M | 3.1, G4S API credentials |
| 3.3 | DHL courier integration | P2 | Not Started | M | 3.1, DHL API credentials |
| 3.4 | Fargo courier integration | P2 | Not Started | M | 3.1, Fargo API credentials |
| 3.5 | Multi-courier rate comparison | P1 | Not Started | M | 3.1 |
| 3.6 | Shipping label generation | P2 | Not Started | L | 3.1, label template engine |
| 3.7 | External tracking sync (pull status from couriers) | P1 | Not Started | L | 3.1 |

**Notes:** Delivery management exists (assignment, GPS waypoints, OTP-based pickup/delivery, route optimization) but is entirely internal to SHARKONE's own delivery riders. No 3PL/courier provider integration exists. Zero references to G4S, DHL, Fargo, or any external logistics in the codebase.

---

## 4. Multi-Store / Omnichannel

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 4.1 | Multi-brand storefronts (white-label) | P3 | Not Started | XL | None |
| 4.2 | Multi-country support (KE, UG, TZ, NG, GH) | P2 | Not Started | XL | i18n, multi-currency (partially done) |
| 4.3 | POS integration for physical retail | P3 | Not Started | XL | None |
| 4.4 | Unified inventory across channels | P3 | Not Started | L | 4.2 |

**Notes:** Individual seller stores exist (`/store/[slug]`), but there is no multi-brand or multi-country infrastructure. Currency switching works (8 currencies via `currency-store.ts`), but all content is English-only and there is no locale routing.

---

## 5. Developer / API Platform

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 5.1 | Webhook system (outbound events) | P1 | Not Started | L | Webhook storage model, retry queue |
| 5.2 | GraphQL API layer | P3 | Not Started | XL | GraphQL schema design |
| 5.3 | SDK generation (TypeScript/Python) | P3 | Not Started | XL | 5.2 or stable REST |
| 5.4 | API key management | P2 | Not Started | M | New model, auth middleware |
| 5.5 | Developer portal / docs | P3 | Not Started | L | 5.4 |

**Notes:** REST API routes exist (86 routes) but there are no outbound webhooks, no GraphQL, no API key management, and no developer documentation.

---

## 6. CMS / Marketing Depth

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 6.1 | Email campaign system | P2 | Not Started | XL | 11.1 (email service) |
| 6.2 | Landing page builder (drag & drop) | P3 | Not Started | XL | None |
| 6.3 | A/B testing framework | P3 | Not Started | L | Analytics pipeline |
| 6.4 | SEO analytics dashboard | P2 | Not Started | M | Google Search Console API |
| 6.5 | Newsletter subscription persistence | P2 | Partial | S | 11.1 |

**Notes:** Blog exists (CRUD via admin + public pages). Hero slides, marketing banners, and flash sales are all functional. The newsletter subscribe in `Footer.tsx` shows a toast but does not persist the email address. OpenGraph and Twitter meta tags are set on most pages, but there's no dynamic SEO analytics.

---

## 7. B2B Depth

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 7.1 | Contract / tiered pricing per company | P1 | Not Started | L | New pricing model |
| 7.2 | Credit limit enforcement at checkout | P1 | Not Started | M | 1.1 |
| 7.3 | Purchase order workflow (approve → fulfill) | P1 | Partial | L | Company model exists |
| 7.4 | Bulk ordering with tiered discounts | P2 | Not Started | M | 7.1 |
| 7.5 | Invoice management & PDF generation | P1 | Partial | L | B2B invoice API route exists (list only) |
| 7.6 | NET 15/30/60/90 payment term enforcement | P1 | Not Started | M | 1.1, 7.2 |

**Notes:** B2B registration page exists (`/b2b`) and creates a `Company` record. The `Company` model has `creditLimit`, `creditUsed`, and `paymentTerms` fields. However, credit limit is never enforced at checkout, contract pricing does not exist, and the invoice API (`/api/b2b/invoices`) only returns mock/empty data. PO numbers are stored on orders but there is no approval workflow.

---

## 8. Performance Optimization

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 8.1 | Bundle analysis (`@next/bundle-analyzer`) | P2 | Not Started | S | None |
| 8.2 | Route-based code splitting audit | P2 | Not Started | M | 8.1 |
| 8.3 | Image CDN optimization (Cloudinary / Imgix / CloudFront) | P2 | Partial | M | CDN account |
| 8.4 | Redis / response caching layer | P1 | Not Started | L | Redis instance |
| 8.5 | ISR / revalidation strategy for products & blog | P1 | Not Started | M | None |
| 8.6 | Lighthouse CI score enforcement | P2 | Not Started | S | CI pipeline (10.x) |

**Notes:** `next.config.ts` enables AVIF/WebP and 60s cache TTL. No `@next/bundle-analyzer`, no Redis, no ISR. Rate limiting in `middleware.ts` uses in-memory `Map` (not Redis), which is lost on server restart and doesn't work across multiple instances.

---

## 9. Testing

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 9.1 | Unit test framework setup (Vitest / Jest) | **P0** | Not Started | S | None |
| 9.2 | Unit tests for utility functions (`lib/`) | P1 | Not Started | M | 9.1 |
| 9.3 | API route integration tests | P1 | Not Started | L | 9.1, test database |
| 9.4 | Component rendering tests (Testing Library) | P1 | Not Started | L | 9.1 |
| 9.5 | E2E tests (Playwright) | P2 | Not Started | XL | 9.1, stable build |
| 9.6 | Test coverage reporting | P2 | Not Started | S | 9.1 |

**Notes:** **Zero test files exist.** No `vitest`, `jest`, `playwright`, or `@testing-library` in dependencies. No test scripts in `package.json`. The `tests/` directory only contains unrelated shell scripts. No `.test.ts`, `.spec.ts`, or `__tests__/` directories.

---

## 10. Infrastructure / CI/CD

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 10.1 | Dockerfile (multi-stage) | P1 | Not Started | M | None |
| 10.2 | Docker Compose (app + SQLite + Redis) | P1 | Not Started | S | 10.1 |
| 10.3 | CI/CD pipeline (GitHub Actions) | P1 | Not Started | M | Git hosting |
| 10.4 | Staging environment | P2 | Not Started | M | 10.1, hosting |
| 10.5 | Error monitoring (Sentry) | P1 | Not Started | S | Sentry account |
| 10.6 | Structured logging (Pino / Winston) | P1 | Not Started | M | None |
| 10.7 | Health check endpoint | P2 | Not Started | S | None |

**Notes:** No `Dockerfile`, no `docker-compose.yml`, no `.github/` directory, no Sentry integration, no structured logging. The app uses `console.error` and `console.warn` exclusively. Build outputs standalone (Next.js `output: "standalone"`), but no containerization exists.

---

## 11. Email / SMS Notifications

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 11.1 | Transactional email service (SendGrid / Postmark) | **P0** | Not Started | M | Email service account |
| 11.2 | Email templates (order confirm, shipping, welcome, etc.) | **P0** | Not Started | L | 11.1 |
| 11.3 | SMS service (Africa's Talking / Twilio) | P1 | Not Started | M | SMS provider account |
| 11.4 | Notification preference management (email vs SMS vs push) | P1 | Partial | S | 11.1, 11.3 |
| 11.5 | Email digest / batch notifications | P3 | Not Started | M | 11.1 |

**Notes:** In-app notifications are fully functional (template system in `lib/notification-templates.ts`, CRUD API at `/api/notifications`, preference API, dropdown component, notifications page). Browser push notifications work via `lib/push-notifications.ts`. However, **no email or SMS is ever sent** — there are no SendGrid, Postmark, Nodemailer, Africa's Talking, or Twilio imports anywhere. The checkout page mentions "A confirmation SMS will be sent" but this is UI text only. The `User.notificationPrefs` field is a raw JSON string with no enforcement.

---

## 12. Advanced Search

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 12.1 | Faceted / filtered search (brand, size, color) | P2 | Not Started | M | Product variant model |
| 12.2 | Search suggestions / autocomplete | P1 | Not Started | M | Search index |
| 12.3 | Recent searches (persisted) | P2 | Not Started | S | Auth system |
| 12.4 | Search analytics (popular queries, zero-result queries) | P2 | Not Started | M | 12.1 |
| 12.5 | Full-text search engine (Meilisearch / Algolia / Typesense) | P1 | Not Started | L | Search engine service |

**Notes:** Basic search exists via `GET /api/products?search=...` using SQLite `contains` (case-sensitive substring match on name and description). The search page (`/search`) has category, price range, and rating filters. The `SearchDialog` component provides debounced search. However, there is no full-text search, no autocomplete suggestions, no recent search history, and no search analytics. SQLite `contains` does not support stemming, fuzzy matching, or relevance scoring.

---

## 13. Product Reviews System — Advanced

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 13.1 | Review moderation queue (admin) | P1 | Not Started | M | Admin UI extension |
| 13.2 | Photo / video upload with reviews | P2 | Not Started | L | File upload service (S3/Cloudinary) |
| 13.3 | Verified purchase badge (auto-set from orders) | P1 | Not Started | M | 13.1, order linkage |
| 13.4 | Seller response to reviews | P2 | Not Started | M | New response model |
| 13.5 | Review helpfulness voting | P3 | Not Started | S | New vote model |
| 13.6 | Review sorting (most recent, most helpful, highest/lowest) | P2 | Not Started | S | None |

**Notes:** Basic reviews work — buyers can submit text reviews with a star rating (`ReviewForm` component), and the `Review` model has an `isVerified` boolean field. However, `isVerified` is never auto-populated from actual purchase data, there is no photo/video upload, no moderation queue, and no seller response capability. Reviews are displayed in a simple list with no sorting options.

---

## 14. Inventory Management Depth

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 14.1 | Barcode scanning (mobile + hardware) | P2 | Not Started | L | Camera API / hardware scanner |
| 14.2 | Batch / lot tracking | P2 | Not Started | L | New batch model |
| 14.3 | Expiry date management | P2 | Not Started | M | 14.2 |
| 14.4 | Multi-warehouse transfer optimization | P2 | Partial | L | Warehouse model exists |
| 14.5 | Low-stock alerts (automated email/SMS) | P1 | Partial | S | 11.1, 11.3 |

**Notes:** Basic inventory exists — `InventoryItem` and `StockTransfer` models, warehouse CRUD, stock adjustment API, transfer between warehouses, and a low-stock alert API. However, transfers are basic (no optimization algorithm), there is no barcode/batch/expiry tracking, and low-stock alerts only create in-app notifications (no email/SMS dispatch).

---

## 15. Customer Support

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 15.1 | Support ticket system | P1 | Not Started | L | New ticket model |
| 15.2 | Live chat widget | P2 | Not Started | L | WebSocket or third-party (Intercom/Crisp) |
| 15.3 | FAQ management (admin CRUD) | P2 | Not Started | M | New FAQ model |
| 15.4 | Knowledge base (categorized articles) | P3 | Not Started | L | CMS extension |

**Notes:** The contact page (`/contact`) has a static FAQ section (hardcoded Q&A array) and a contact form that shows a success toast but does not persist submissions. No ticket system, no live chat, no knowledge base.

---

## 16. Reporting

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 16.1 | Downloadable reports (PDF / Excel) | P1 | Not Started | L | PDF/Excel generation library |
| 16.2 | Scheduled / automated reports | P2 | Not Started | L | Cron system, 16.1 |
| 16.3 | Custom report builder | P3 | Not Started | XL | 16.1 |

**Notes:** The analytics page (`/analytics`) renders charts (revenue, orders, products, delivery) using Recharts, and admin analytics API routes exist. However, there is no export-to-CSV/PDF/Excel functionality, no scheduled reports, and no custom report builder.

---

## 17. Multi-Language / Internationalization (i18n)

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 17.1 | `next-intl` configuration & message files | P1 | Not Started | M | None |
| 17.2 | Language switcher UI | P1 | Not Started | S | 17.1 |
| 17.3 | Swahili translation | P1 | Not Started | M | 17.1 |
| 17.4 | Additional languages (French, Arabic, Amharic) | P3 | Not Started | L | 17.1 |
| 17.5 | RTL support (Arabic) | P3 | Not Started | L | 17.4 |

**Notes:** `next-intl@4.3.4` is installed as a dependency but **completely unconfigured**. There are no message files, no `[locale]` routing, no `i18n.ts` config, and no language switcher. All UI text is hardcoded in English. The `locale` string in `currency.ts` is used only for number formatting, not for translations.

---

## 18. Mobile App

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 18.1 | React Native / Expo app | P3 | Not Started | XL | None |
| 18.2 | Push notifications (mobile) | P2 | Not Started | L | 18.1, FCM/APNs |
| 18.3 | Biometric authentication | P3 | Not Started | M | 18.1 |

**Notes:** No mobile app project exists. The web app is responsive and works on mobile browsers.

---

## 19. Accessibility (a11y)

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 19.1 | WCAG 2.1 AA audit | P1 | Not Started | M | None |
| 19.2 | Screen reader optimization (all pages) | P1 | Partial | L | 19.1 |
| 19.3 | Full keyboard navigation support | P1 | Partial | L | 19.1 |
| 19.4 | Skip-to-content links | P2 | Not Started | S | None |
| 19.5 | Focus management in modals/drawers | P2 | Partial | S | None |
| 19.6 | Color contrast audit & fixes | P2 | Not Started | M | None |

**Notes:** Partial a11y exists — the Navbar, CartSidebar, and ProductCard have basic `aria-label` attributes. Radix UI primitives provide some built-in a11y (dialogs, selects, tabs). However, most interactive elements lack proper ARIA roles, most images have no `alt` text (many use `aria-hidden="true"`), there are no skip-to-content links, keyboard focus trapping in modals is inconsistent, and no formal WCAG audit has been conducted.

---

## 20. Advanced Analytics

| # | Feature | Priority | Status | Complexity | Dependencies |
|---|---------|----------|--------|------------|-------------|
| 20.1 | Real-time analytics dashboard (WebSocket) | P2 | Not Started | XL | WebSocket infrastructure |
| 20.2 | Cohort analysis | P3 | Not Started | L | Event tracking pipeline |
| 20.3 | Funnel tracking (browse → cart → checkout → purchase) | P2 | Not Started | L | 20.2 |
| 20.4 | Export analytics to CSV / PDF | P1 | Not Started | M | 16.1 |

**Notes:** The analytics page (`/analytics`, 877 lines) shows revenue over time, top products, category breakdown, delivery stats, and recent orders via Recharts. Admin analytics API routes exist. However, data is fetched on-demand (not real-time), there is no cohort/funnel analysis, and no export capability.

---

---

## Existing Feature Completeness Audit

| Feature | Completeness | Notes |
|---------|-------------|-------|
| **Product Catalog** | **90%** | CRUD, search, categories, filters, featured, detail pages. Missing: variants (size/color), product comparison on detail page, bulk import |
| **Shopping Cart** | **95%** | Add/remove/update quantity, persistent (Zustand + localStorage), coupon input, sidebar drawer. Fully functional |
| **Checkout Flow** | **40%** | Multi-step UI (shipping → payment → review → confirm) is polished, but no real payment processing. Orders are created without payment verification |
| **Seller Dashboard** | **80%** | Product CRUD, order management, earnings/wallet, transaction history, withdrawal requests, stats. Missing: product analytics, bulk actions |
| **Admin Dashboard** | **85%** | User management, product management, seller verification, flash sale scheduling, banner management, coupon management, audit logs, warehouse/inventory management. Very comprehensive |
| **Delivery System** | **75%** | Assignment, GPS waypoints, OTP pickup/delivery, route optimization, proof of delivery, status tracking. Missing: 3PL integration, external courier sync |
| **Notifications (In-App)** | **90%** | Template system, CRUD API, preference management, dropdown, dedicated page, browser push for flash sales. Fully functional |
| **Blog / CMS** | **70%** | Full CRUD (admin), public listing, detail page, SEO metadata. Missing: rich text editor (MDX is imported but unused in admin), categories, tags filter, scheduled publishing |
| **Flash Sales** | **85%** | Scheduling, auto-activation cron, countdown timer, stock management, banner notification. Fully functional |
| **Coupons & Promotions** | **85%** | Create/edit/delete, validation API, usage tracking, per-user limits, applicable categories. Fully functional |
| **B2B Registration** | **30%** | Registration form and Company model exist. Credit limit, payment terms, PO numbers are stored but never enforced. No contract pricing |
| **User Auth** | **35%** | Login/register forms exist, password hashing (`lib/password.ts`), auth store. But no real session management, no JWT/cookie, no protected routes. API routes do not validate auth |
| **Returns & Refunds** | **70%** | Return request form, status tracking, admin review workflow, refund status. Missing: automated refund processing, pickup scheduling |
| **Order Tracking** | **80%** | Public tracking page (`/track`) with simulated GPS, OTP verification, delivery confirmation. Functional |
| **Reviews** | **50%** | Submit reviews, display with ratings, verified badge field. Missing: moderation, photos, seller responses, sorting, auto-verification |
| **Multi-Currency** | **80%** | 8 currencies, switcher component, per-product price conversion. Functional for display |
| **Wishlist** | **60%** | Page exists (`/wishlist`), heart icon on products. State management likely client-side only (no API persistence) |
| **Product Comparison** | **60%** | Compare page (`/compare`) and store exist. UI is present but completeness of feature is unknown |
| **Recently Viewed** | **70%** | Zustand store, component, localStorage persistence. Functional |
| **SEO** | **50%** | OpenGraph + Twitter meta on most pages, `robots.txt`, dynamic metadata. Missing: sitemap.xml, structured data (JSON-LD), canonical URLs, hreflang |
| **Rate Limiting** | **40%** | In-memory rate limiter in middleware. Works for single-instance but not production-grade (no Redis, no distributed support) |
| **Audit Logging** | **80%** | `audit()` utility, AuditLog model, used in order/delivery/admin APIs. Functional |

---

## Half-Finished / Stub Features

1. **Newsletter subscription** — `Footer.tsx` shows a toast but never persists the email. No model, no API.
2. **Google OAuth** — Button exists on login page; clicking shows "coming soon" toast. No NextAuth provider configured.
3. **Contact form** — Shows success toast on submit but does not persist the message anywhere.
4. **Map on contact page** — Section header says "Map Placeholder" with a gradient background div. No real map (Google Maps / Leaflet) integrated.
5. **Blog cover images** — Blog detail page has a comment `/* Cover image / placeholder */` with a gradient fallback when no cover image exists.
6. **Delivery tracking GPS** — The `/track` page simulates GPS movement ("Simulating real-time GPS movement every 5 seconds"). Not connected to real GPS data.
7. **Auth system** — `auth-store.ts` has types and Zustand store, `lib/password.ts` has bcrypt hashing, but no actual session/JWT management. API routes don't check authentication.
8. **`@mdxeditor/editor`** — Installed in dependencies but not used anywhere in the codebase.

---

## Summary Statistics

| Category | Not Started | Partial | In Progress | Total Items |
|----------|-------------|---------|-------------|-------------|
| Payment Gateway | 5 | 0 | 1 | 6 |
| HoneyCoin Wallet | 5 | 1 | 0 | 6 |
| 3PL Integration | 6 | 1 | 0 | 7 |
| Multi-Store / Omnichannel | 3 | 1 | 0 | 4 |
| Developer / API Platform | 4 | 1 | 0 | 5 |
| CMS / Marketing | 4 | 1 | 0 | 5 |
| B2B Depth | 4 | 2 | 0 | 6 |
| Performance | 5 | 1 | 0 | 6 |
| Testing | 5 | 1 | 0 | 6 |
| Infrastructure / CI/CD | 6 | 1 | 0 | 7 |
| Email / SMS | 4 | 1 | 0 | 5 |
| Advanced Search | 4 | 1 | 0 | 5 |
| Reviews — Advanced | 5 | 1 | 0 | 6 |
| Inventory — Depth | 4 | 2 | 0 | 6 |
| Customer Support | 3 | 1 | 0 | 4 |
| Reporting | 2 | 1 | 0 | 3 |
| i18n | 4 | 1 | 0 | 5 |
| Mobile App | 2 | 1 | 0 | 3 |
| Accessibility | 5 | 3 | 0 | 8 |
| Advanced Analytics | 3 | 1 | 0 | 4 |
| **TOTAL** | **83** | **22** | **1** | **106** |

### Priority Breakdown

| Priority | Count |
|----------|-------|
| **P0 (Critical)** | 7 |
| **P1 (High)** | 37 |
| **P2 (Medium)** | 40 |
| **P3 (Low)** | 22 |

---

*End of document.*
