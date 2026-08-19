import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    // Get all order items for this seller
    const where: Record<string, unknown> = { sellerId };

    const orderItems = await db.orderItem.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: { select: { name: true } },
          },
        },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by order, aggregating item count and total
    const orderMap = new Map<string, {
      id: string;
      orderNumber: string;
      buyerName: string;
      status: string;
      total: number;
      itemCount: number;
      createdAt: string;
    }>();

    for (const item of orderItems) {
      const orderId = item.orderId;
      if (orderMap.has(orderId)) {
        const existing = orderMap.get(orderId)!;
        existing.itemCount += item.quantity;
        existing.total += item.price * item.quantity;
      } else {
        const orderStatus = status && status !== 'ALL'
          ? item.order.status === status
          : true;

        if (!orderStatus && status && status !== 'ALL') continue;

        orderMap.set(orderId, {
          id: orderId,
          orderNumber: item.order.orderNumber,
          buyerName: item.order.buyer.name,
          status: item.order.status,
          total: item.price * item.quantity,
          itemCount: item.quantity,
          createdAt: item.order.createdAt.toISOString(),
        });
      }
    }

    let orders = Array.from(orderMap.values());

    // Filter by status if provided
    if (status && status !== 'ALL' && Object.values(OrderStatus).includes(status as OrderStatus)) {
      orders = orders.filter(o => o.status === status);
    }

    // Sort by date descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
