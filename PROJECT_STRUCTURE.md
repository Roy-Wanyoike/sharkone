# SHARKONE Project Structure

This document provides a detailed breakdown of the SHARKONE project folder layout.

## Overview

SHARKONE is a full-featured e-commerce platform built with **Next.js 16 App Router**.
Because Next.js co-locates frontend pages and backend API routes under `src/app/`,
the directory uses a clear naming convention to distinguish between the two.

```
sharkone/
├── mobile/                        # Future React Native mobile app (placeholder)
├── prisma/                        # Database schema and seed scripts
├── public/                        # Static assets (logos, robots.txt)
├── scripts/                       # One-off scripts (seeding, migrations)
├── src/
│   ├── app/                       # Next.js App Router (pages + API)
│   │   ├── (pages)/               # → Frontend pages
│   │   │   ├── page.tsx           #     Home page
│   │   │   ├── login/             #     Authentication pages
│   │   │   ├── register/          #     Registration pages
│   │   │   ├── product/[id]/      #     Product detail page
│   │   │   ├── checkout/          #     Checkout flow
│   │   │   ├── admin/             #     Admin dashboard pages
│   │   │   ├── dashboard/         #     Seller & delivery dashboards
│   │   │   ├── blog/              #     Blog pages
│   │   │   ├── search/            #     Search page
│   │   │   ├── wishlist/          #     Wishlist page
│   │   │   ├── compare/           #     Product comparison
│   │   │   ├── cart/              #     Cart page
│   │   │   ├── orders/            #     Order pages
│   │   │   ├── returns/           #     Returns page
│   │   │   ├── support/           #     Support/tickets
│   │   │   ├── b2b/               #     B2B commerce
│   │   │   ├── sell/              #     Seller onboarding
│   │   │   ├── wallet/            #     Wallet page
│   │   │   ├── notifications/     #     Notifications page
│   │   │   ├── analytics/         #     Analytics page
│   │   │   ├── track/             #     Delivery tracking
│   │   │   ├── about/             #     About page
│   │   │   └── contact/           #     Contact page
│   │   │
│   │   ├── api/                   # → Backend API routes
│   │   │   ├── auth/              #     Authentication (login, register, me)
│   │   │   ├── products/          #     Product CRUD + reviews
│   │   │   ├── orders/            #     Order management
│   │   │   ├── payments/          #     Payment checkout, verify, webhooks
│   │   │   ├── delivery/          #     Delivery tracking, assignment, routing
│   │   │   ├── sellers/           #     Seller listing
│   │   │   ├── buyer/             #     Buyer-specific endpoints
│   │   │   ├── seller/[sellerId]/ #     Per-seller endpoints (products, orders, stats, withdrawals)
│   │   │   ├── categories/        #     Category listing
│   │   │   ├── flash-sales/       #     Flash sale CRUD + cron/auto
│   │   │   ├── banners/           #     Marketing banners
│   │   │   ├── coupons/           #     Coupon validation
│   │   │   ├── wishlist/          #     Wishlist CRUD
│   │   │   ├── addresses/         #     Address CRUD
│   │   │   ├── wallet/            #     Wallet balance, deduct, transactions
│   │   │   ├── notifications/     #     Notification CRUD + preferences
│   │   │   ├── returns/           #     Return request CRUD
│   │   │   ├── support/           #     Support tickets + messages
│   │   │   ├── contact/           #     Contact form
│   │   │   ├── newsletter/        #     Newsletter subscription
│   │   │   ├── search/            #     Search suggestions + recent
│   │   │   ├── blog/              #     Blog listing + detail
│   │   │   ├── faqs/              #     FAQ CRUD
│   │   │   ├── shipping/          #     Shipping quote
│   │   │   ├── hero/              #     Hero carousel data
│   │   │   ├── emails/            #     Email sending
│   │   │   ├── webhooks/          #     Webhook management
│   │   │   ├── stores/            #     Store page data
│   │   │   ├── b2b/               #     B2B companies + invoices + orders
│   │   │   ├── health/            #     Health check
│   │   │   └── admin/             #     Admin-only endpoints (37 routes)
│   │   │       ├── analytics/     #       Revenue, product, delivery analytics + export
│   │   │       ├── audit-logs/    #       Audit trail
│   │   │       ├── banners/       #       Banner management + reorder
│   │   │       ├── blog/          #       Blog management
│   │   │       ├── couriers/      #       Courier management
│   │   │       ├── coupons/       #       Coupon management
│   │   │       ├── deliveries/    #       Delivery management + reassign + stats
│   │   │       ├── drivers/       #       Driver performance
│   │   │       ├── flash-sales/   #       Flash sale scheduling
│   │   │       ├── inventory/     #       Stock tracking, adjustments, alerts
│   │   │       ├── orders/        #       Order management
│   │   │       ├── products/      #       Product management
│   │   │       ├── returns/       #       Return management
│   │   │       ├── reviews/       #       Review management
│   │   │       ├── sellers/       #       Seller verification
│   │   │       ├── stats/         #       Dashboard stats
│   │   │       ├── transfers/     #       Stock transfers
│   │   │       ├── users/         #       User management
│   │   │       └── warehouses/    #       Warehouse management + stats
│   │   │
│   │   ├── layout.tsx            # Root layout (providers, navbar, footer)
│   │   ├── globals.css            # Global styles (Tailwind)
│   │   ├── not-found.tsx          # Custom 404 page
│   │   ├── error.tsx              # Error boundary
│   │   ├── global-error.tsx       # Global error boundary
│   │   ├── loading.tsx            # Root loading state
│   │   └── sitemap.ts             # Dynamic sitemap generation
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    #   shadcn/ui primitives (40+ components)
│   │   │                         #   button, card, dialog, sheet, form, etc.
│   │   ├── ecommerce/             #   Domain-specific components (23)
│   │   │                         #   Navbar, Footer, ProductCard, CartSidebar, etc.
│   │   │   └── index.ts           #   Barrel file — re-exports all ecommerce components
│   │   ├── auth/                  #   Authentication components
│   │   │                         #   RolePickerModal
│   │   ├── seo/                   #   SEO components
│   │   │                         #   JsonLd (structured data)
│   │   └── QueryProvider.tsx      #   TanStack Query provider
│   │
│   ├── lib/                       # Shared utilities
│   │   ├── db.ts                  #   Prisma client singleton
│   │   ├── utils.ts               #   General helpers (cn, sanitizeSearch)
│   │   ├── password.ts            #   Password hashing (SHA-256) + OTP generation
│   │   ├── auth-guard.ts          #   Auth middleware helpers (getAuthUser, requireAuth)
│   │   ├── audit.ts               #   Audit logging
│   │   ├── currency.ts            #   Multi-currency conversion & formatting
│   │   ├── logger.ts              #   Structured logger
│   │   ├── sentry.ts              #   Sentry error reporting
│   │   ├── push-notifications.ts  #   Browser push notification helpers
│   │   ├── notification-templates.ts # Notification template system
│   │   ├── couriers/              #   Courier provider abstraction
│   │   │   ├── index.ts           #   Register & get courier provider
│   │   │   ├── types.ts           #   CourierProvider interface
│   │   │   ├── register.ts        #   Provider registry
│   │   │   └── providers/         #   Implementations (internal, mock-dhl, mock-g4s)
│   │   ├── payments/              #   Payment provider abstraction
│   │   │   ├── index.ts           #   Register & get payment provider
│   │   │   ├── types.ts           #   PaymentProvider interface
│   │   │   ├── register.ts        #   Provider registry
│   │   │   └── providers/         #   Implementations (mock-stripe, mock-mpesa)
│   │   ├── email/                 #   Email provider abstraction
│   │   │   ├── index.ts           #   Register & get email provider
│   │   │   ├── types.ts           #   EmailProvider interface
│   │   │   ├── register.ts        #   Provider registry
│   │   │   ├── templates.ts       #   Email templates
│   │   │   └── providers/         #   Implementations (mock-email)
│   │   ├── webhooks/              #   Webhook system
│   │   │   ├── index.ts           #   Barrel re-exports
│   │   │   ├── events.ts          #   Webhook event constants
│   │   │   └── dispatch.ts        #   Webhook dispatch logic
│   │   └── index.ts               #   Barrel file — re-exports all utilities
│   │
│   ├── store/                     # Zustand state management
│   │   ├── auth-store.ts          #   Authentication state
│   │   ├── cart-store.ts          #   Shopping cart state
│   │   ├── currency-store.ts      #   Selected currency state
│   │   ├── compare-store.ts       #   Product comparison state
│   │   └── recently-viewed-store.ts # Recently viewed products
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-mobile.ts          #   Responsive breakpoint detection
│   │   ├── use-toast.ts           #   Toast notification hook
│   │   └── index.ts               #   Barrel file — re-exports all hooks
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts               #   Shared interfaces (Product, Order, Seller, etc.)
│   │
│   ├── messages/                  # i18n translations
│   │   ├── en.json                #   English translations
│   │   └── sw.json                #   Swahili translations
│   │
│   ├── i18n/                      # i18n configuration
│   │   └── request.ts             #   next-intl request config
│   │
│   └── middleware.ts              # Next.js middleware (auth, rate limiting)
│
├── prisma/
│   └── schema.prisma              # Database schema (20+ models)
│
├── mobile/                        # Placeholder for React Native mobile app
│   └── README.md                  #   Mobile app description & planned stack
│
├── public/                        # Static assets
│   ├── logo.svg                   #   Primary logo
│   ├── logo-white.svg             #   White variant logo
│   └── robots.txt                 #   Search engine directives
│
├── .env.example                   # Environment variable template
├── docker-compose.yml             # Docker development setup
├── Dockerfile                     # Production Docker image
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies & scripts
├── vitest.config.ts               # Test configuration
├── vitest.setup.ts                # Test setup
├── eslint.config.mjs              # ESLint configuration
├── postcss.config.mjs             # PostCSS configuration
├── components.json                # shadcn/ui configuration
├── README.md                      # Project overview
├── PROJECT_STRUCTURE.md           # ← This file
└── PENDING_FEATURES.md            # Feature roadmap (106 features)
```

## Directory Responsibilities

| Directory | Purpose |
|-----------|---------|
| `src/app/(pages)/` | **Frontend pages** — Next.js App Router pages rendered in the browser. Each subdirectory is a route. |
| `src/app/api/` | **Backend API routes** — Server-side REST API endpoints. 60+ routes covering all business domains. |
| `src/components/ui/` | **shadcn/ui primitives** — 40+ headless UI components built on Radix (button, card, dialog, form, etc.). |
| `src/components/ecommerce/` | **Domain components** — Business-specific React components (Navbar, ProductCard, CartSidebar, etc.). |
| `src/components/auth/` | **Auth components** — Authentication UI (role picker, login forms, etc.). |
| `src/components/seo/` | **SEO components** — Structured data (JSON-LD), meta tags, sitemap generation. |
| `src/lib/` | **Shared utilities** — Database client, auth guards, currency conversion, payment/email/courier provider abstractions, audit logging, notifications, error reporting. |
| `src/store/` | **Zustand state** — Client-side state stores with persist middleware (cart, auth, currency, compare, recently viewed). |
| `src/hooks/` | **Custom hooks** — React hooks for responsive design (`useIsMobile`) and toast notifications (`useToast`). |
| `src/types/` | **TypeScript types** — Shared interfaces and types used across the app (Product, Order, Seller, CartItem, etc.). |
| `src/messages/` | **i18n translations** — JSON translation files for English (`en`) and Swahili (`sw`). |
| `mobile/` | **Future mobile app** — Placeholder directory for the planned React Native (Expo) mobile application. |
| `prisma/` | **Database schema** — Prisma ORM schema with 20+ models and seed scripts. |

## Key Patterns

### Barrel Files

Several directories include `index.ts` barrel files for cleaner imports:

```typescript
// Instead of:
import { Navbar } from '@/components/ecommerce/Navbar';
import { ProductCard } from '@/components/ecommerce/ProductCard';

// You can write:
import { Navbar, ProductCard } from '@/components/ecommerce';
```

Barrel files exist at:
- `src/components/ecommerce/index.ts`
- `src/lib/index.ts`
- `src/hooks/index.ts`
- `src/lib/couriers/index.ts`
- `src/lib/payments/index.ts`
- `src/lib/email/index.ts`
- `src/lib/webhooks/index.ts`

### Provider Abstraction

Payment, email, and courier systems use a **registry pattern** for provider abstraction:

- `register.ts` — Registers providers
- `types.ts` — Defines the provider interface
- `providers/` — Concrete implementations (mock providers for development)
- `index.ts` — Barrel file exposing `getProvider()` and `registerProvider()`
