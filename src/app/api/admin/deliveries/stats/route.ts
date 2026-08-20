import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [active, completedToday, failed] = await Promise.all([
      db.delivery.count({
        where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION'] } },
      }),
      db.delivery.count({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      db.delivery.count({
        where: { status: 'FAILED' },
      }),
    ]);

    // Count orders that are PROCESSING or SHIPPED but don't have a delivery record
    const pendingOrders = await db.order.count({
      where: {
        status: { in: ['PROCESSING', 'SHIPPED'] },
        delivery: null,
      },
    });

    return NextResponse.json({
      active,
      completedToday,
      pendingAssignment: pendingOrders,
      failed,
    });
  } catch (error) {
    console.error('Delivery stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
