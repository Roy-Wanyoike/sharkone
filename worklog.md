# SHARKONE Worklog

## Task: flash — Flash Sale Scheduler + Push Notification System

### Files Created

| File | Purpose |
|------|---------|
| `src/app/api/admin/flash-sales/schedule/route.ts` | POST: schedule flash sale with random start time within 24h + create buyer notifications. GET: list upcoming flash sales. |
| `src/app/api/flash-sales/auto/route.ts` | GET: returns active flash sales, starting-soon (within 15 min), and `newSaleStarted` flag (started within 2 min). |
| `src/lib/push-notifications.ts` | Browser Notification API utility — `requestNotificationPermission()`, `showNotification()`, `scheduleNotification()`, `isNotificationGranted()`. |
| `src/components/ecommerce/FlashSaleNotifier.tsx` | Client component: requests notification permission on mount, polls `/api/flash-sales/auto` every 60s, shows browser notification + amber slide-down banner when new sale starts, auto-dismisses after 10s. |
| `scripts/seed-flash-schedule.ts` | Seeds 2 flash sales: Sony WH-1000XM5 (30% off, +1h) and AirPods Max (45% off, +6h), plus buyer notifications. |

### Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Added `<FlashSaleNotifier />` import and placed it above `<Navbar />` so the notification banner appears at the very top. |

### Seed Results

- **Flash Sale 1**: Sony WH-1000XM5, 30% off ($349.99 → $244.99), starts in 1h, 60min duration.
- **Flash Sale 2**: AirPods Max, 45% off ($549 → $301.95), starts in 6h, 90min duration.
- **Notifications**: 10 notification records created for 5 BUYER users.

### Design Notes

- Amber (#F59E0B) gradient banner with spring animation for in-app flash sale alerts.
- Deduplication via `seenSalesRef` prevents repeated notifications for the same sale.
- Starting-soon notifications only fire when ≤5 minutes remain to avoid noise.
- All lint checks pass cleanly.
