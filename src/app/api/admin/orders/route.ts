import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL' && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          orderItems: {
            select: { id: true, quantity: true, price: true },
          },
          delivery: {
            select: { status: true, deliveryPerson: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      platformFee: o.platformFee,
      deliveryFee: o.deliveryFee,
      paymentStatus: o.paymentStatus,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
      buyer: o.buyer,
      itemCount: o.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      delivery: o.delivery,
    }));

    return NextResponse.json({
      orders: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
