import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryStatus } from '@prisma/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryPersonId } = await params;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeDeliveries, completedToday, completedTotal, completedDeliveries] =
      await Promise.all([
        db.delivery.count({
          where: {
            deliveryPersonId,
            status: { notIn: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED] },
          },
        }),
        db.delivery.count({
          where: {
            deliveryPersonId,
            status: DeliveryStatus.DELIVERED,
            deliveredAt: { gte: todayStart },
          },
        }),
        db.delivery.count({
          where: {
            deliveryPersonId,
            status: DeliveryStatus.DELIVERED,
          },
        }),
        db.delivery.findMany({
          where: {
            deliveryPersonId,
            status: DeliveryStatus.DELIVERED,
          },
          include: {
            order: { select: { deliveryFee: true } },
          },
        }),
      ]);

    const totalEarnings = completedDeliveries.reduce(
      (sum, d) => sum + d.order.deliveryFee,
      0
    );

    return NextResponse.json({
      activeDeliveries,
      completedToday,
      completedTotal,
      totalEarnings,
      rating: 4.8,
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery stats' },
      { status: 500 }
    );
  }
}
