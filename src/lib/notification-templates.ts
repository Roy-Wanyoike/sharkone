// ============================================================
// Notification Template System
// ============================================================

import prisma from '@/lib/db';
import { NotificationType } from '@prisma/client';

// ---------- Types ----------

export type NotificationTemplateKey =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'SELLER_VERIFIED'
  | 'LOW_STOCK'
  | 'WELCOME';

export interface NotificationTemplate {
  key: NotificationTemplateKey;
  title: string;            // supports {{variable}} interpolation
  body: string;             // supports {{variable}} interpolation
  icon: 'order' | 'delivery' | 'payment' | 'system' | 'alert';
  type: NotificationType;
}

// ---------- Templates ----------

export const NOTIFICATION_TEMPLATES: Record<NotificationTemplateKey, NotificationTemplate> = {
  ORDER_CONFIRMED: {
    key: 'ORDER_CONFIRMED',
    title: 'Order Confirmed 🎉',
    body: 'Your order {{orderNumber}} has been confirmed. We\'re preparing your items for shipment.',
    icon: 'order',
    type: 'ORDER',
  },
  ORDER_SHIPPED: {
    key: 'ORDER_SHIPPED',
    title: 'Order Shipped 📦',
    body: 'Your order {{orderNumber}} has been shipped! Track your delivery with tracking number {{trackingNumber}}.',
    icon: 'delivery',
    type: 'DELIVERY',
  },
  ORDER_DELIVERED: {
    key: 'ORDER_DELIVERED',
    title: 'Order Delivered ✅',
    body: 'Your order {{orderNumber}} has been delivered. Thank you for shopping with SHARKONE!',
    icon: 'delivery',
    type: 'DELIVERY',
  },
  PAYMENT_RECEIVED: {
    key: 'PAYMENT_RECEIVED',
    title: 'Payment Received 💰',
    body: 'Payment of {{amount}} for order {{orderNumber}} has been received and confirmed.',
    icon: 'payment',
    type: 'PAYMENT',
  },
  RETURN_APPROVED: {
    key: 'RETURN_APPROVED',
    title: 'Return Approved ✓',
    body: 'Your return request for order {{orderNumber}} has been approved. Refund of {{refundAmount}} will be processed shortly.',
    icon: 'system',
    type: 'SYSTEM',
  },
  RETURN_REJECTED: {
    key: 'RETURN_REJECTED',
    title: 'Return Rejected ✗',
    body: 'Your return request for order {{orderNumber}} has been rejected. Reason: {{reason}}.',
    icon: 'system',
    type: 'SYSTEM',
  },
  SELLER_VERIFIED: {
    key: 'SELLER_VERIFIED',
    title: 'Seller Account Verified! 🎊',
    body: 'Congratulations, {{sellerName}}! Your seller account has been verified. You can now list and sell products on SHARKONE.',
    icon: 'system',
    type: 'SYSTEM',
  },
  LOW_STOCK: {
    key: 'LOW_STOCK',
    title: 'Low Stock Alert ⚠️',
    body: 'Product "{{productName}}" has only {{stockCount}} units remaining. Consider restocking soon.',
    icon: 'alert',
    type: 'SYSTEM',
  },
  WELCOME: {
    key: 'WELCOME',
    title: 'Welcome to SHARKONE! 🦈',
    body: 'Hi {{userName}}, welcome to SHARKONE! Discover amazing products and great deals. Start shopping now!',
    icon: 'system',
    type: 'SYSTEM',
  },
};

// ---------- Render ----------

/**
 * Interpolate {{variable}} placeholders in a template string.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

// ---------- Create ----------

interface CreateNotificationOptions {
  userId: string;
  templateKey: NotificationTemplateKey;
  variables?: Record<string, string>;
  data?: Record<string, unknown>;
}

/**
 * Render a notification template and persist it to the DB.
 * Returns the created notification record.
 */
export async function createNotification(
  userId: string,
  templateKey: NotificationTemplateKey,
  variables: Record<string, string> = {},
  data?: Record<string, unknown>
) {
  const tpl = NOTIFICATION_TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Unknown notification template: ${templateKey}`);
  }

  const title = renderTemplate(tpl.title, variables);
  const message = renderTemplate(tpl.body, variables);

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: tpl.type,
      data: data ? JSON.stringify(data) : null,
    },
  });

  return notification;
}
