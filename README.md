# SHARKONE — Shop. Ship. Smile.

A full-featured e-commerce platform built for the East African market, with multi-currency support, real-time delivery tracking, flash sales, and a comprehensive admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animations | Framer Motion |
| Database | Prisma ORM + SQLite |
| State | Zustand (persist middleware) |
| Data Fetching | TanStack Query v5 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner (toasts) + Browser Notification API |

## Features

### Buyer Experience
- **Product Catalog** — Browse, search, filter, and compare products
- **Flash Sales** — Random hourly flash sales with countdown timers and push notifications
- **Multi-Currency** — KSH (default), UGX, TZS, USD, EUR, GBP, NGN, RWF with IP-based detection
- **Cart & Wishlist** — Persistent cart with quantity management and wishlist
- **Checkout** — 4-step checkout (shipping, payment, review, confirmation)
- **Order Tracking** — Real-time GPS delivery tracking with SVG route visualization
- **Coupon System** — Percentage, fixed-amount, and free-shipping coupons with validation
- **Product Reviews** — Star ratings with review history
- **Notifications** — In-app + browser push notifications with preferences
- **Returns** — Return request flow with status tracking

### Seller Experience
- **Seller Dashboard** — Overview, products, orders, returns, analytics tabs
- **Product Management** — Create, edit, and manage product listings
- **Order Management** — View and process customer orders
- **Earnings & Withdrawals** — Track revenue and request withdrawals
- **Store Page** — Custom storefront at `/store/[slug]`

### Admin Panel
- **Dashboard Overview** — Revenue, orders, users, trends with charts
- **Product Management** — Full CRUD with category assignment
- **Order Management** — View, filter, and update order statuses
- **User Management** — View and manage buyers, sellers, delivery riders
- **Seller Verification** — Approve/reject seller applications
- **Warehouse Management** — Add and manage warehouses with stats
- **Inventory Management** — Stock tracking, adjustments, low-stock alerts
- **Stock Transfers** — Transfer stock between warehouses
- **Banner Management** — Create, reorder, and manage marketing banners
- **Flash Sale Scheduler** — Schedule flash sales with random timing
- **Delivery Management** — Active deliveries, driver assignment, route optimization
- **Coupon Management** — Create and manage discount coupons
- **Audit Logs** — Full audit trail of admin actions
- **Analytics** — Revenue trends, top products, delivery performance
- **Blog/CMS** — Create and manage blog posts with MDX editor

### B2B Commerce
- Company registration with business details
- Bulk ordering interface
- Invoice generation

### Security
- Password hashing (SHA-256 + random salt)
- HTTP-only session cookies
- Rate limiting (30/min auth, 100/min API)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Admin route auth guards on all 37 admin API routes
- Audit logging for sensitive actions
- Input sanitization

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or Bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Roy-Wanyoike/sharkone.git
cd sharkone

# Install dependencies
npm install
# or: bun install

# Set up database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file (see `.env.example`):

```env
# Database (defaults to SQLite, no config needed for dev)
DATABASE_URL="file:./dev.db"
```

### Seeding the Database

```bash
# Run the main seed script
npx tsx scripts/seed.ts
```

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

For a detailed folder layout with descriptions of every directory, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

```
sharkone/
├── src/app/                   # Frontend pages + API routes (Next.js App Router)
│   ├── api/                # 60+ Backend API routes
│   ├── admin/              # Admin dashboard
│   ├── product/[id]/        # Product detail
│   └── ...                 # All other pages
├── src/components/            # Reusable UI components
├── src/lib/                   # Shared utilities (database, auth, payments, etc.)
├── src/store/                 # Zustand state management
├── src/hooks/                 # Custom React hooks
├── src/types/                 # TypeScript type definitions
├── src/messages/              # i18n translations (en, sw)
├── mobile/                   # Future React Native mobile app (placeholder)
├── prisma/                   # Database schema (20+ Prisma models)
└── public/                   # Static assets
```

## Design System

- **Primary Color:** `#0F172A` (dark navy)
- **Accent Color:** `#F59E0B` (amber)
- **Typography:** Geist Sans (variable font)
- **Spacing:** `px-6 md:px-16 lg:px-32` (responsive horizontal padding)
- **Components:** shadcn/ui (Radix primitives)

## Roadmap

See [PENDING_FEATURES.md](./PENDING_FEATURES.md) for the full list of 106 planned features across 20 categories.

## License

Private — © 2025 SHARKONE by Roy Wanyoike (Youngshark3)
