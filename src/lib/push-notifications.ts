/**
 * Push Notification Utility
 * Uses the browser Notification API for in-page push notifications.
 */

/**
 * Request notification permission from the browser.
 * Returns 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Browser does not support the Notification API');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

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
 * Schedule a notification for a future time using setTimeout.
 * Returns a timeout ID that can be cleared if needed.
 */
export function scheduleNotification(
  title: string,
  body: string,
  scheduledTime: Date,
  icon?: string,
  url?: string
): number {
  // Use window.setTimeout to get browser-native number return type
  const delay = scheduledTime.getTime() - Date.now();

  if (delay <= 0) {
    // Already past the scheduled time, show immediately
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
