# Task ID: 3 - Inventory System APIs

## Agent: Inventory System

## Task
Create inventory management and stock transfer API routes for SHARKONE ecommerce.

## Files Created
1. `src/app/api/admin/inventory/route.ts` — GET: list all inventory with product/warehouse names, filter by warehouseId and lowStock
2. `src/app/api/admin/inventory/adjust/route.ts` — POST: adjust inventory quantity (positive=add, negative=remove), validates available stock, sets lastRestocked on add
3. `src/app/api/admin/transfers/route.ts` — GET: list transfers with product/warehouse names, filter by status. POST: create transfer with PENDING status, validates source stock, generates STF-NNN transfer number
4. `src/app/api/admin/transfers/[id]/route.ts` — PUT: approve (checks stock, sets APPROVED), complete (deducts source, adds dest in transaction, sets COMPLETED), cancel (sets CANCELLED)
5. `src/app/api/admin/inventory/alerts/route.ts` — GET: returns items where available qty <= reorder level with product/warehouse names and deficit info
6. `scripts/seed-transfers.ts` — Seeds 3 sample transfers (PENDING, APPROVED, IN_TRANSIT) between warehouses

## Notes
- Uses `import { db } from '@/lib/db'` matching existing codebase pattern
- Transfer number generation: sequential STF-001, STF-002, etc.
- Complete action uses Prisma transaction for atomic stock movement
- Low stock filter: `quantity - reservedQuantity <= reorderLevel`
- All routes pass `bun run lint` with zero errors
- Seed script successfully ran and created STF-001, STF-002, STF-003
