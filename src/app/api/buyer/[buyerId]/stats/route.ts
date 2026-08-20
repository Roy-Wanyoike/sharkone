import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryStatus } from '@prisma/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ buyerId: string }> }
) {
  try {
    const { buyerId } = await params;

    const [totalOrders, totalSpentResult, pendingOrders, activeDeliveries] =
      await Promise.all([
        db.order.count({ where: { buyerId } }),
        db.order.aggregate({
          _sum: { totalAmount: true },
          where: { buyerId },
        }),
        db.order.count({
          where: {
            buyerId,
            status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] },
          },
        }),
        db.delivery.count({
          where: {
            order: { buyerId },
            status: { notIn: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED] },
          },
        }),
      ]);

    return NextResponse.json({
      totalOrders,
      totalSpent: totalSpentResult._sum.totalAmount || 0,
      pendingOrders,
      activeDeliveries,
    });
  } catch (error) {
    console.error('Error fetching buyer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyer stats' },
      { status: 500 }
    );
  }
}
