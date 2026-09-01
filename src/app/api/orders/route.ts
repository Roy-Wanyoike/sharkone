import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { audit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      orderNumber,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      deliveryFee,
      platformFee,
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

    // Use a default buyer ID (first buyer user) or create a placeholder
    let buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          email: buyerEmail || 'guest@sharkone.com',
          name: buyerName || 'Guest User',
          phone: buyerPhone || null,
          role: 'BUYER',
        },
      });
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
      },
    });

    // Create order items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      const sellerId = product?.sellerId || '';
      const seller = sellerId
        ? await prisma.seller.findUnique({ where: { id: sellerId } })
        : null;
      const commissionRate = seller?.commissionRate || 0.1;
      const sellerEarnings = Math.round(item.price * item.quantity * (1 - commissionRate));

      await prisma.orderItem.create({
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
    }

    audit({ userId: buyer.id, role: 'BUYER', action: 'CREATE_ORDER', resource: 'order', resourceId: order.id, details: `Order ${order.orderNumber}, total: ${totalAmount}`, req: request });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}