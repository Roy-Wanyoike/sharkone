# Task ID: fix-all — Comprehensive Audit & Fix Report

## Summary
Comprehensive audit of SHARKONE ecommerce project covering hardcoded currency, local currency functions, API route correctness, broken imports, and SellerDashboard currency handling.

---

## 1. Hardcoded Currency (KES / $ with digits)

### Files Found & Fixed:

| File | Issue | Fix |
|------|-------|-----|
| `src/components/ecommerce/SellerDashboard.tsx` | 14x `formatCurrency(x, 'KSH')` + `Price (KES)` label | Added `useCurrencyStore` → all calls use `currencyCode` |
| `src/app/admin/page.tsx` | 10x `formatCurrency(x, 'KSH')` + 2x `Price (KES)` labels | Added `useCurrencyStore` → all calls use `currencyCode` |
| `src/components/ecommerce/DeliveryDashboard.tsx` | 2x `formatCurrency(x, 'KSH')` | Added `useCurrencyStore` → uses `currencyCode` |
| `src/app/sell/page.tsx` | 1x `formatCurrency(0, 'KSH')` | Added `useCurrencyStore` → uses `currencyCode` |
| `src/app/analytics/page.tsx` | 8x `formatCurrency(x, 'KSH')` (incl. compact) | Added `useCurrencyStore` → all calls use `currencyCode` |
| `src/app/admin/deliveries/page.tsx` | 7x `formatCurrency(x, 'KSH')` | Added `useCurrencyStore` in `DeliveriesContent` & `ExpandedRow` → uses `currencyCode` |
| `src/app/api/coupons/validate/route.ts` | `new Intl.NumberFormat('en-KE', { currency: 'KES' })` | Replaced with `formatCurrency()` from `@/lib/currency` (server-side, uses default KSH) |

**Total: 42+ hardcoded currency references fixed across 7 files.**

---

## 2. Local Currency Functions

**Result: CLEAN** — No `formatKES`, `kesFormatter`, or local currency formatting functions found anywhere in the codebase.

---

## 3. API Route Audit

### 3a. DB Import Fix (Critical — 83 files)

**Problem:** All API routes and `src/lib/audit.ts` used `import { db } from '@/lib/db'` (named export).

**Fix:**
- Changed `src/lib/db.ts`: renamed internal variable from `db` to `prisma`, changed from named export `export { db }` to default export `export default prisma`
- Batch-replaced all 82 API route files: `import { db } from '@/lib/db'` → `import prisma from '@/lib/db'`
- Batch-replaced all `db.xxx` → `prisma.xxx` (including `db.$transaction` and `db.$queryRaw`)
- Fixed `src/lib/audit.ts` import and usage

### 3b. Error Handling

**Found 1 route missing try/catch:**
- `src/app/api/stores/[slug]/route.ts` — Added try/catch with 500 error response
- `src/app/api/route.ts` — Just a hello-world endpoint, no DB access, no try/catch needed

### 3c. JSON Responses

All API routes already return proper `NextResponse.json()` responses. No issues found.

---

## 4. Broken Import Check

**Result: CLEAN** — All 20 imported components from `@/components/ecommerce/` exist:
NotificationDropdown, CurrencySwitcher, Footer, ProductCard, Navbar, HeroCarousel, FeaturedCategories, TrendingProducts, ProductGrid, CartSidebar, SearchDialog, FlashSaleNotifier, PromoBanner, FlashSaleBanner, MarketingBanners, TrustBadges, RecentlyViewed, ScrollToTop, ProductDetailModal, SellerDashboard, DeliveryDashboard, CouponInput

---

## 5. SellerDashboard Currency Fix

- Added `import { useCurrencyStore } from '@/store/currency-store'`
- Added `const currencyCode = useCurrencyStore((s) => s.code)` in the component
- Replaced all 14 hardcoded `'KSH'` arguments with `currencyCode`
- Changed `Price (KES)` form label to `Price ({currencyCode})`

---

## Verification

- `bun run lint` passes with **zero errors**
- No remaining `KES` or hardcoded `'KSH'` in `formatCurrency` calls anywhere in `src/`
- No remaining `import { db } from '@/lib/db'` anywhere in the codebase
- No remaining `db.` references in any API route
