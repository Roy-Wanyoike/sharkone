import { prisma as db } from './db';
export { db };
export { cn, sanitizeSearch } from './utils';
export { hashPassword, verifyPassword, generateOTP } from './password';
export { getAuthUser, requireAuth } from './auth-guard';
export { audit } from './audit';
export {
  CURRENCIES,
  convertFromKSH,
  formatCurrency,
  getCurrencyForCountry,
  getAvailableCurrencies,
} from './currency';
export type { CurrencyConfig } from './currency';
export {
  NOTIFICATION_TEMPLATES,
  renderTemplate,
  createNotification,
} from './notification-templates';
export type { NotificationTemplateKey, NotificationTemplate } from './notification-templates';
export {
  requestNotificationPermission,
  showNotification,
  scheduleNotification,
  isNotificationGranted,
  scheduleFlashSaleNotifications,
} from './push-notifications';
export type { FlashSaleNotificationInput, NotificationPrismaClient } from './push-notifications';
export { captureException, captureMessage, setUser, setTag } from './sentry';
export { default as Sentry } from './sentry';
export { default as logger } from './logger';

// Sub-modules
export * as couriers from './couriers';
export * as payments from './payments';
export * as email from './email';
export * as webhooks from './webhooks';
