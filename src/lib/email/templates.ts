import { EmailTemplate } from './types';

// ── Shared email wrapper with SHARKONE branding ────────────────────────

function wrapHtml(innerHtml: string, previewText?: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${previewText ? `<meta name="preview" content="${previewText.replace(/"/g, '&quot;')}" />` : ''}
  <title>SHARKONE</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0F172A;padding:24px 40px;border-radius:12px 12px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:28px;font-weight:800;color:#F59E0B;letter-spacing:2px;">SHARKONE</h1>
                  </td>
                  <td align="right">
                    <span style="color:#94a3b8;font-size:13px;">E-Commerce</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0F172A;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px 0;color:#F59E0B;font-size:14px;font-weight:700;letter-spacing:1px;">SHARKONE</p>
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">This email was sent by SHARKONE E-Commerce.<br />Do not reply to this email directly.</p>
              <p style="margin:12px 0 0 0;color:#475569;font-size:11px;">&copy; ${new Date().getFullYear()} SHARKONE. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#F59E0B;border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#0F172A;font-size:15px;font-weight:700;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function rowHtml(label: string, value: string, bold = false) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:40%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0F172A;font-size:14px;${bold ? 'font-weight:600;' : ''}">${value}</td>
  </tr>`;
}

// ── Templates ───────────────────────────────────────────────────────────

const ORDER_CONFIRMED: EmailTemplate = {
  name: 'ORDER_CONFIRMED',
  subject: 'Order Confirmed — {{orderNumber}}',
  generateHtml(data) {
    const { orderNumber, customerName, items, total, currency, deliveryAddress, estimatedDelivery } = data;
    const itemsArr = (items as Array<{ name: string; quantity: number; price: string }>) || [];
    const itemRows = itemsArr
      .map(
        (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0F172A;font-size:14px;">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0F172A;font-size:14px;text-align:right;font-weight:600;">${item.price}</td>
      </tr>`
      )
      .join('');

    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Order Confirmed! 🎉</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>, thank you for your order!</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">We've received your order and it's being processed. Here's a summary:</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #0F172A;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Item</th>
          <th style="padding:10px 0;border-bottom:2px solid #0F172A;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</th>
          <th style="padding:10px 0;border-bottom:2px solid #0F172A;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Price</th>
        </tr>
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:14px 0;color:#0F172A;font-size:16px;font-weight:700;text-align:right;">Total</td>
          <td style="padding:14px 0;color:#F59E0B;font-size:18px;font-weight:800;text-align:right;">${currency || 'KES'} ${total}</td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin:0 0 24px 0;">
        ${rowHtml('Order Number', String(orderNumber), true)}
        ${deliveryAddress ? rowHtml('Delivery Address', String(deliveryAddress)) : ''}
        ${estimatedDelivery ? rowHtml('Est. Delivery', String(estimatedDelivery), true) : ''}
      </table>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">You can track your order status in your account dashboard.</p>
      `,
      `Your order ${orderNumber} has been confirmed`
    );
  },
};

const ORDER_SHIPPED: EmailTemplate = {
  name: 'ORDER_SHIPPED',
  subject: 'Your Order Has Shipped — {{orderNumber}}',
  generateHtml(data) {
    const { orderNumber, customerName, trackingNumber, trackingUrl, carrier, estimatedDelivery } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Your Order Is on Its Way! 📦</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on the way to you.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin:0 0 24px 0;">
        ${rowHtml('Order Number', String(orderNumber), true)}
        ${carrier ? rowHtml('Carrier', String(carrier)) : ''}
        ${trackingNumber ? rowHtml('Tracking Number', String(trackingNumber), true) : ''}
        ${estimatedDelivery ? rowHtml('Est. Delivery', String(estimatedDelivery), true) : ''}
      </table>

      ${trackingUrl ? buttonHtml('Track Your Package', String(trackingUrl)) : ''}

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">If you have any questions about your delivery, feel free to contact our support team.</p>
      `,
      `Your order ${orderNumber} has shipped`
    );
  },
};

const ORDER_DELIVERED: EmailTemplate = {
  name: 'ORDER_DELIVERED',
  subject: 'Order Delivered — {{orderNumber}}',
  generateHtml(data) {
    const { orderNumber, customerName, reviewUrl } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Order Delivered! ✅</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">Your order <strong>${orderNumber}</strong> has been delivered successfully. We hope you love your purchase!</p>

      <div style="background-color:#fffbeb;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
        <p style="margin:0 0 4px 0;color:#92400e;font-size:14px;font-weight:700;">How was your experience?</p>
        <p style="margin:0;color:#a16207;font-size:13px;line-height:1.5;">Your feedback helps us improve. Leave a review for the items you purchased.</p>
      </div>

      ${reviewUrl ? buttonHtml('Leave a Review', String(reviewUrl)) : ''}

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Thank you for shopping with SHARKONE!</p>
      `,
      `Your order ${orderNumber} has been delivered`
    );
  },
};

const PAYMENT_RECEIVED: EmailTemplate = {
  name: 'PAYMENT_RECEIVED',
  subject: 'Payment Received — {{orderNumber}}',
  generateHtml(data) {
    const { orderNumber, customerName, amount, currency, method, transactionId } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Payment Received 💳</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">We've received your payment for order <strong>${orderNumber}</strong>. Your order is now being prepared for delivery.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px 0;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 4px 0;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payment Confirmed</p>
            <p style="margin:0;color:#0F172A;font-size:24px;font-weight:800;">${currency || 'KES'} ${amount}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;">
        ${rowHtml('Order Number', String(orderNumber), true)}
        ${method ? rowHtml('Payment Method', String(method)) : ''}
        ${transactionId ? rowHtml('Transaction ID', String(transactionId)) : ''}
      </table>
      `,
      `Payment of ${amount} received for order ${orderNumber}`
    );
  },
};

const WELCOME: EmailTemplate = {
  name: 'WELCOME',
  subject: 'Welcome to SHARKONE! 🦈',
  generateHtml(data) {
    const { customerName, loginUrl } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#0F172A;">Welcome, ${customerName}!</p>
      <p style="margin:0 0 24px 0;color:#F59E0B;font-size:16px;font-weight:600;">You're officially part of the SHARKONE family.</p>
      <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.6;">Thanks for creating an account with us. Discover thousands of products from top sellers across the platform.</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">Here's what you can do:</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
        <tr>
          <td style="padding:8px 0;color:#0F172A;font-size:14px;">🛒 <strong>Browse &amp; Shop</strong> — Find the best deals</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#0F172A;font-size:14px;">📦 <strong>Track Orders</strong> — Real-time delivery updates</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#0F172A;font-size:14px;">⭐ <strong>Leave Reviews</strong> — Help other shoppers</td>
        </tr>
      </table>

      ${loginUrl ? buttonHtml('Start Shopping', String(loginUrl)) : ''}

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">If you didn't create this account, you can safely ignore this email.</p>
      `,
      `Welcome to SHARKONE, ${customerName}!`
    );
  },
};

const RETURN_APPROVED: EmailTemplate = {
  name: 'RETURN_APPROVED',
  subject: 'Return Approved — {{returnNumber}}',
  generateHtml(data) {
    const { returnNumber, customerName, orderNumber, refundAmount, currency, instructions } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Return Approved ✅</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">Your return request <strong>${returnNumber}</strong> for order <strong>${orderNumber}</strong> has been approved.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px 0;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 4px 0;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Refund Amount</p>
            <p style="margin:0;color:#0F172A;font-size:24px;font-weight:800;">${currency || 'KES'} ${refundAmount}</p>
          </td>
        </tr>
      </table>

      ${instructions ? `
      <div style="background-color:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px 0;">
        <p style="margin:0 0 8px 0;color:#0F172A;font-size:14px;font-weight:700;">Return Instructions:</p>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;white-space:pre-line;">${instructions}</p>
      </div>
      ` : ''}

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Your refund will be processed within 5-7 business days.</p>
      `,
      `Your return ${returnNumber} has been approved`
    );
  },
};

const RETURN_REJECTED: EmailTemplate = {
  name: 'RETURN_REJECTED',
  subject: 'Return Update — {{returnNumber}}',
  generateHtml(data) {
    const { returnNumber, customerName, orderNumber, reason, supportUrl } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Return Request Update</p>
      <p style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#64748b;font-size:14px;line-height:1.6;">After reviewing your return request <strong>${returnNumber}</strong> for order <strong>${orderNumber}</strong>, we're unable to approve it at this time.</p>

      <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
        <p style="margin:0 0 4px 0;color:#991b1b;font-size:14px;font-weight:700;">Reason</p>
        <p style="margin:0;color:#b91c1c;font-size:13px;line-height:1.5;">${reason || 'Your return request does not meet our return policy requirements.'}</p>
      </div>

      <p style="margin:0 0 16px 0;color:#334155;font-size:14px;line-height:1.6;">If you believe this is a mistake or have additional information, please reach out to our support team.</p>

      ${supportUrl ? buttonHtml('Contact Support', String(supportUrl)) : ''}
      `,
      `Update on your return request ${returnNumber}`
    );
  },
};

const LOW_STOCK_ALERT: EmailTemplate = {
  name: 'LOW_STOCK_ALERT',
  subject: '⚠️ Low Stock Alert — {{productName}}',
  generateHtml(data) {
    const { productName, currentStock, threshold, sku, adminUrl } = data;
    return wrapHtml(
      `
      <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Low Stock Alert ⚠️</p>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.6;">The following product has fallen below the minimum stock threshold and requires attention.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:0 0 24px 0;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 12px 0;color:#0F172A;font-size:18px;font-weight:700;">${productName}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${rowHtml('Current Stock', String(currentStock), true)}
              ${threshold ? rowHtml('Threshold', String(threshold)) : ''}
              ${sku ? rowHtml('SKU', String(sku)) : ''}
            </table>
          </td>
        </tr>
      </table>

      ${adminUrl ? buttonHtml('Manage Inventory', String(adminUrl)) : ''}

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">This is an automated alert. Please restock or adjust the threshold as needed.</p>
      `,
      `Low stock alert: ${productName}`
    );
  },
};

// ── Export all templates ─────────────────────────────────────────────────

export const emailTemplates: EmailTemplate[] = [
  ORDER_CONFIRMED,
  ORDER_SHIPPED,
  ORDER_DELIVERED,
  PAYMENT_RECEIVED,
  WELCOME,
  RETURN_APPROVED,
  RETURN_REJECTED,
  LOW_STOCK_ALERT,
];
