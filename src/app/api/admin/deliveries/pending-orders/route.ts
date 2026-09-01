import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PROCESSING', 'SHIPPED'] },
        delivery: null,
      },
      include: {
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        shippingAddress: o.shippingAddress,
        buyer: o.buyer,
      })),
    });
  } catch (error) {
    console.error('Pending orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
