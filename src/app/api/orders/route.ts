import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { audit } from '@/lib/audit';
import { sendTemplatedEmail } from '@/lib/email';
import { registerEmailProviders } from '@/lib/email/register';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const {
      orderNumber,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      deliveryFee,
      platformFee,
      couponCode,
      couponDiscount,
      buyerEmail,
      buyerName,
      buyerPhone,
    } = body;

    if (!orderNumber || !items || !items.length || !shippingAddress || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const buyer = await prisma.user.findUnique({ where: { id: user.id } });
    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // B2B credit limit check
    if (buyer.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: buyer.companyId },
      });
      if (company && company.creditLimit > 0) {
        if (company.creditUsed + totalAmount > company.creditLimit) {
          return NextResponse.json(
            { error: 'Credit limit exceeded. Contact your account manager.' },
            { status: 403 }
          );
        }
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: buyer.id,
        totalAmount,
        deliveryFee: deliveryFee || 0,
        platformFee: platformFee || 0,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        status: 'PENDING',
        paymentStatus: paymentMethod === 'wallet' ? 'PAID' : 'PENDING',
        companyId: buyer.companyId || undefined,
      },
    });

    // Pre-fetch a fallback seller in case a product has no valid seller
    const fallbackSeller = await prisma.seller.findFirst();

    // Create order items + deduct stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      // Skip items whose product no longer exists
      if (!product) {
        console.warn(`[Order] Product ${item.productId} not found, skipping item`);
        continue;
      }

      const sellerId = product.sellerId || fallbackSeller?.id || '';
      const seller = sellerId
        ? await prisma.seller.findUnique({ where: { id: sellerId } })
        : null;
      const commissionRate = seller?.commissionRate || 0.1;
      const sellerEarnings = Math.round(item.price * item.quantity * (1 - commissionRate));

      // Create order item first, then deduct stock to avoid race condition
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          sellerId,
          sellerEarnings,
          status: 'PENDING',
        },
      });

      // Deduct stock only after order item is successfully created
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Track coupon usage
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });

        await prisma.usedCoupon.create({
          data: {
            couponId: coupon.id,
            userId: buyer.id,
            orderId: order.id,
          },
        }).catch(() => {
          // Unique constraint [couponId, userId] may already exist; ignore
        });
      }
    }

    // Create delivery record for tracking
    await prisma.delivery.create({
      data: {
        orderId: order.id,
        status: 'ASSIGNED',
      },
    });

    // Increment B2B credit used after successful order creation
    if (buyer.companyId) {
      await prisma.company.update({
        where: { id: buyer.companyId },
        data: { creditUsed: { increment: totalAmount } },
      });
    }

    audit({ userId: buyer.id, role: 'BUYER', action: 'CREATE_ORDER', resource: 'order', resourceId: order.id, details: `Order ${order.orderNumber}, total: ${totalAmount}`, req: request });

    // Fire-and-forget: send ORDER_CONFIRMED email to buyer
    try {
      registerEmailProviders();
      const emailItems = items.map((item: { name?: string; price: number; quantity: number }) => ({
        name: item.name || 'Product',
        price: String(item.price),
        quantity: item.quantity,
      }));
      sendTemplatedEmail('ORDER_CONFIRMED', buyer.email, {
        orderNumber: order.orderNumber,
        customerName: buyer.name,
        items: emailItems,
        total: String(totalAmount),
        currency: 'KES',
        deliveryAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      }).catch((err) => console.error('Failed to send order confirmation email:', err));
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}