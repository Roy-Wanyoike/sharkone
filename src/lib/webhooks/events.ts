export const WebhookEvents = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_LOW_STOCK: 'product.low_stock',
  USER_REGISTERED: 'user.registered',
  REVIEW_SUBMITTED: 'review.submitted',
} as const;
