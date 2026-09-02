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
  | 'ORDER_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REFUND_PROCESSED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'COUPON_RECEIVED'
  | 'PRICE_DROP'
  | 'SELLER_VERIFIED'
  | 'LOW_STOCK'
  | 'WELCOME'
  | 'REVIEW_REQUESTED';

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
  ORDER_CANCELLED: {
    key: 'ORDER_CANCELLED',
    title: 'Order Cancelled ❌',
    body: 'Your order {{orderNumber}} has been cancelled. A refund of {{refundAmount}} will be processed to your original payment method.',
    icon: 'order',
    type: 'ORDER',
  },
  PAYMENT_FAILED: {
    key: 'PAYMENT_FAILED',
    title: 'Payment Failed ⚠️',
    body: 'Payment of {{amount}} for order {{orderNumber}} failed. Please try again or use a different payment method.',
    icon: 'payment',
    type: 'PAYMENT',
  },
  REFUND_PROCESSED: {
    key: 'REFUND_PROCESSED',
    title: 'Refund Processed 💸',
    body: 'Your refund of {{refundAmount}} for order {{orderNumber}} has been processed. It may take 3-5 business days to appear in your account.',
    icon: 'payment',
    type: 'PAYMENT',
  },
  COUPON_RECEIVED: {
    key: 'COUPON_RECEIVED',
    title: 'New Coupon for You! 🎟️',
    body: 'You\'ve received a coupon! Use code {{couponCode}} for {{discount}} off your next order. Valid until {{expiryDate}}.',
    icon: 'system',
    type: 'SYSTEM',
  },
  PRICE_DROP: {
    key: 'PRICE_DROP',
    title: 'Price Drop Alert! 📉',
    body: 'Good news! {{productName}} just dropped in price from {{oldPrice}} to {{newPrice}}. Grab it before the price goes back up!',
    icon: 'system',
    type: 'SYSTEM',
  },
  REVIEW_REQUESTED: {
    key: 'REVIEW_REQUESTED',
    title: 'How was your purchase? ⭐',
    body: 'Your order {{orderNumber}} was delivered. Share your experience and leave a review to help other shoppers!',
    icon: 'order',
    type: 'ORDER',
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
