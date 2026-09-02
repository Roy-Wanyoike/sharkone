/**
 * Push Notification Utility
 *
 * Client-side: browser Notification API wrappers.
 * Server-side: `scheduleFlashSaleNotifications` for creating in-app notifications.
 */

// ============================================================
// Client-side helpers (browser Notification API)
// ============================================================

/**
 * Request browser push notification permission.
 * Safe to call from client components — no-ops on the server.
 * Returns 'granted' | 'denied' | 'default'
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * @deprecated Use `requestBrowserNotificationPermission` instead.
 * Kept as an alias for backward-compat.
 */
export const requestNotificationPermission = requestBrowserNotificationPermission;

/**
 * Show an immediate browser notification.
 */
export function showNotification(
  title: string,
  body: string,
  icon?: string,
  url?: string
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: icon || '/favicon.ico',
    tag: `sharkone-${Date.now()}`,
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.open(url, '_blank');
    };
  }

  // Auto-close after 8 seconds
  setTimeout(() => notification.close(), 8000);
}

/**
 * Schedule a browser notification for a future time using setTimeout.
 * Returns a timeout ID that can be cleared if needed.
 */
export function scheduleNotification(
  title: string,
  body: string,
  scheduledTime: Date,
  icon?: string,
  url?: string
): number {
  const delay = scheduledTime.getTime() - Date.now();

  if (delay <= 0) {
    showNotification(title, body, icon, url);
    return 0;
  }

  return window.setTimeout(() => {
    showNotification(title, body, icon, url);
  }, delay) as unknown as number;
}

/**
 * Check if notification permission has been granted.
 */
export function isNotificationGranted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

// ============================================================
// Server-side helper — schedule in-app (Prisma) notifications
// ============================================================

/** Minimal shape needed to build notification text for a flash sale. */
export interface FlashSaleNotificationInput {
  name: string;
  discountPercentage: number;
  startTime: Date | string;
  product?: {
    name?: string;
  } | null;
}

/** Minimal prisma-like interface so we don't import the actual client here. */
export interface NotificationPrismaClient {
  user: {
    findMany(args: { where: { role: string }; select: { id: boolean } }): Promise<Array<{ id: string }>>;
  };
  notification: {
    createMany(args: { data: Array<Record<string, unknown>> }): Promise<{ count: number }>;
  };
}

/**
 * Server-side only: creates in-app Notification rows for every BUYER user.
 *
 * Usage inside an API route:
 * ```ts
 * import prisma from '@/lib/db';
 * import { scheduleFlashSaleNotifications } from '@/lib/push-notifications';
 * await scheduleFlashSaleNotifications(flashSale, prisma);
 * ```
 */
export async function scheduleFlashSaleNotifications(
  flashSale: FlashSaleNotificationInput,
  prismaClient: NotificationPrismaClient
): Promise<number> {
  const buyers = await prismaClient.user.findMany({
    where: { role: 'BUYER' },
    select: { id: true },
  });

  if (buyers.length === 0) return 0;

  const startStr =
    typeof flashSale.startTime === 'string'
      ? new Date(flashSale.startTime).toLocaleString()
      : flashSale.startTime.toLocaleString();

  const productName = flashSale.product?.name ?? flashSale.name;

  const notificationsData = buyers.map((buyer) => ({
    userId: buyer.id,
    title: '🔥 Upcoming Flash Sale!',
    message: `${productName} at ${Math.round(flashSale.discountPercentage)}% off — starts at ${startStr}. Don't miss it!`,
    type: 'SYSTEM',
  }));

  await prismaClient.notification.createMany({ data: notificationsData });

  return notificationsData.length;
}
