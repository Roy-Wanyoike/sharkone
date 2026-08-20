import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Prisma.DeliveryWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.order = {
        orderNumber: { contains: search },
      };
    }

    const [deliveries, total] = await Promise.all([
      db.delivery.findMany({
        where,
        include: {
          order: {
            include: {
              buyer: {
                select: { name: true },
              },
            },
          },
          deliveryPerson: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.delivery.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const formattedDeliveries = deliveries.map(d => ({
      id: d.id,
      orderId: d.orderId,
      status: d.status,
      pickupOtp: d.pickupOtp,
      deliveryOtp: d.deliveryOtp,
      deliveredAt: d.deliveredAt,
      notes: d.notes,
      createdAt: d.createdAt,
      order: {
        orderNumber: d.order.orderNumber,
        buyerName: d.order.buyer?.name || 'Unknown',
        shippingAddress: d.order.shippingAddress,
        totalAmount: d.order.totalAmount,
      },
      deliveryPerson: d.deliveryPerson
        ? { name: d.deliveryPerson.name }
        : null,
    }));

    return NextResponse.json({
      deliveries: formattedDeliveries,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('List deliveries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
